const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { adminAuth } = require('../middleware/admin');

router.get('/admin', adminAuth, async (req, res) => {
    try {
        // Get statistics
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const totalLikes = await Post.aggregate([
            { $project: { likeCount: { $size: '$likes' } } },
            { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]);
        const totalComments = await Post.aggregate([
            { $project: { commentCount: { $size: '$comments' } } },
            { $group: { _id: null, total: { $sum: '$commentCount' } } }
        ]);

        // Recent users (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
        const newPostsThisWeek = await Post.countDocuments({ createdAt: { $gte: weekAgo } });

        // Get recent activity
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username avatar email createdAt role');

        const recentPosts = await Post.find()
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(5);

        // Top users by followers
        const topUsers = await User.aggregate([
            { $project: { username: 1, avatar: 1, followerCount: { $size: '$followers' } } },
            { $sort: { followerCount: -1 } },
            { $limit: 5 }
        ]);

        // Posts per day (last 7 days)
        const postsPerDay = await Post.aggregate([
            { $match: { createdAt: { $gte: weekAgo } } },
            { $group: { 
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.render('admin/dashboard', {
            user: req.user,
            stats: {
                totalUsers,
                totalPosts,
                totalLikes: totalLikes[0]?.total || 0,
                totalComments: totalComments[0]?.total || 0,
                newUsersThisWeek,
                newPostsThisWeek
            },
            recentUsers,
            recentPosts,
            topUsers,
            postsPerDay
        });
    } catch (err) {
        console.error('Admin Dashboard Error:', err);
        res.status(500).render('404', { user: req.user, message: 'Error loading dashboard' });
    }
});

router.get('/admin/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const filter = req.query.filter || 'all';

        let query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        if (filter === 'admin') query.role = 'admin';
        if (filter === 'moderator') query.role = 'moderator';
        if (filter === 'banned') query.isBanned = true;
        if (filter === 'verified') query.isVerified = true;

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('username email name avatar role isVerified isBanned createdAt followers following');

        // Get post counts for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const postCount = await Post.countDocuments({ user: user._id });
            return {
                ...user.toObject(),
                postCount,
                followerCount: user.followers?.length || 0,
                followingCount: user.following?.length || 0
            };
        }));

        res.render('admin/users', {
            user: req.user,
            users: usersWithStats,
            currentPage: page,
            totalPages,
            totalUsers,
            search,
            filter
        });
    } catch (err) {
        console.error('Admin Users Error:', err);
        res.status(500).render('404', { user: req.user, message: 'Error loading users' });
    }
});

router.get('/admin/posts', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const filter = req.query.filter || 'all';

        let query = {};
        
        if (search) {
            query.$or = [
                { caption: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        if (filter === 'archived') query.isArchived = true;
        if (filter === 'active') query.isArchived = false;

        const totalPosts = await Post.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Post.find(query)
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('admin/posts', {
            user: req.user,
            posts,
            currentPage: page,
            totalPages,
            totalPosts,
            search,
            filter
        });
    } catch (err) {
        console.error('Admin Posts Error:', err);
        res.status(500).render('404', { user: req.user, message: 'Error loading posts' });
    }
});

router.get('/admin/analytics', adminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // User registrations over time
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { 
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Post activity over time
        const postActivity = await Post.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { 
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                posts: { $sum: 1 },
                likes: { $sum: { $size: '$likes' } },
                comments: { $sum: { $size: '$comments' } }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Top hashtags
        const topHashtags = await Post.aggregate([
            { $unwind: '$hashtags' },
            { $group: { _id: '$hashtags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Most active users
        const mostActiveUsers = await Post.aggregate([
            { $group: { _id: '$user', postCount: { $sum: 1 } } },
            { $sort: { postCount: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { 
                username: '$user.username', 
                avatar: '$user.avatar', 
                postCount: 1 
            }}
        ]);

        // Most liked posts
        const topPosts = await Post.aggregate([
            { $project: { 
                title: 1, 
                image: 1,
                caption: 1,
                user: 1,
                likeCount: { $size: '$likes' },
                commentCount: { $size: '$comments' }
            }},
            { $sort: { likeCount: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' }
        ]);

        res.render('admin/analytics', {
            user: req.user,
            days,
            userGrowth,
            postActivity,
            topHashtags,
            mostActiveUsers,
            topPosts
        });
    } catch (err) {
        console.error('Admin Analytics Error:', err);
        res.status(500).render('404', { user: req.user, message: 'Error loading analytics' });
    }
});

router.post('/admin/user/:id/ban', adminAuth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser.role === 'admin') {
            return res.status(403).json({ error: 'Cannot ban an admin' });
        }

        targetUser.isBanned = !targetUser.isBanned;
        await targetUser.save();

        res.json({ 
            success: true, 
            isBanned: targetUser.isBanned,
            message: targetUser.isBanned ? 'User banned successfully' : 'User unbanned successfully'
        });
    } catch (err) {
        console.error('Ban User Error:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.post('/admin/user/:id/verify', adminAuth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        targetUser.isVerified = !targetUser.isVerified;
        await targetUser.save();

        res.json({ 
            success: true, 
            isVerified: targetUser.isVerified,
            message: targetUser.isVerified ? 'User verified' : 'Verification removed'
        });
    } catch (err) {
        console.error('Verify User Error:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.post('/admin/user/:id/role', adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Only admin can change roles
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change roles' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        targetUser.role = role;
        await targetUser.save();

        res.json({ 
            success: true, 
            role: targetUser.role,
            message: `User role updated to ${role}`
        });
    } catch (err) {
        console.error('Update Role Error:', err);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.delete('/admin/user/:id', adminAuth, async (req, res) => {
    try {
        // Only admin can delete users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete users' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete an admin' });
        }

        // Delete user's posts
        await Post.deleteMany({ user: targetUser._id });
        
        // Remove user from followers/following lists
        await User.updateMany(
            { followers: targetUser._id },
            { $pull: { followers: targetUser._id } }
        );
        await User.updateMany(
            { following: targetUser._id },
            { $pull: { following: targetUser._id } }
        );

        // Delete user
        await User.findByIdAndDelete(targetUser._id);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete User Error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.delete('/admin/post/:id', adminAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await Post.findByIdAndDelete(post._id);

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Delete Post Error:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

router.post('/admin/post/:id/archive', adminAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        post.isArchived = !post.isArchived;
        await post.save();

        res.json({ 
            success: true, 
            isArchived: post.isArchived,
            message: post.isArchived ? 'Post archived' : 'Post restored'
        });
    } catch (err) {
        console.error('Archive Post Error:', err);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

const VerificationRequest = require('../models/VerificationRequest');

router.get('/admin/verifications', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const status = req.query.status || 'pending';
        
        const query = status === 'all' ? {} : { status };
        
        const total = await VerificationRequest.countDocuments(query);
        const requests = await VerificationRequest.find(query)
            .populate('user', 'username avatar name email followers')
            .populate('reviewedBy', 'username')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        // Count by status
        const counts = {
            pending: await VerificationRequest.countDocuments({ status: 'pending' }),
            approved: await VerificationRequest.countDocuments({ status: 'approved' }),
            rejected: await VerificationRequest.countDocuments({ status: 'rejected' })
        };
        
        res.render('admin/verifications', {
            user: req.user,
            requests,
            counts,
            currentStatus: status,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Admin Verifications Error:', err);
        res.status(500).render('404', { user: req.user, message: 'Error loading verifications' });
    }
});

router.post('/admin/verification/:id/review', adminAuth, async (req, res) => {
    try {
        const { action, adminNotes, rejectionReason } = req.body;
        
        const request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        if (adminNotes) request.adminNotes = adminNotes;
        if (rejectionReason) request.rejectionReason = rejectionReason;
        
        await request.save();
        
        // If approved, update user's verified status
        if (action === 'approve') {
            await User.findByIdAndUpdate(request.user, { isVerified: true });
        }
        
        // Send notification to user
        const Notification = require('../models/Notification');
        await new Notification({
            recipient: request.user,
            sender: req.user._id,
            type: 'system',
            message: action === 'approve' 
                ? 'Congratulations! Your verification request has been approved. You now have a verified badge.'
                : `Your verification request was not approved. ${rejectionReason || 'Please try again later.'}`
        }).save();
        
        res.json({ 
            success: true, 
            message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
        });
    } catch (err) {
        console.error('Review Verification Error:', err);
        res.status(500).json({ error: 'Failed to review request' });
    }
});

module.exports = router;
