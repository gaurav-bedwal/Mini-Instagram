const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../utils/multer');
const { uploadImage } = require('../utils/cloudinary');
const { registerValidation, loginValidation, profileValidation, validate } = require('../middleware/validators');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

router.get('/register', (req, res) => {
  res.render('register', { error: req.flash('error') });
});

router.post('/register', upload.single('avatar'), registerValidation, validate, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let avatarUrl = '';

    if (req.file) {
      const result = await uploadImage(req.file.path);
      avatarUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds
    const user = new User({
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      avatar: avatarUrl
    });

    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Registration Error:', err);
    if (err.code === 11000) {
      req.flash('error', 'Username already exists. Please choose another one.');
    } else {
      req.flash('error', 'Registration failed. Please try again.');
    }
    res.redirect('/register');
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error') });
});

router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.cookie('token', token, cookieOptions);
      res.redirect('/');
    } else {
      req.flash('error', 'Invalid username or password.');
      res.redirect('/login');
    }
  } catch (err) {
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: req.flash('error'), success: req.flash('success') });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      req.flash('error', 'No account found with that email address.');
      return res.redirect('/forgot-password');
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, you would send an email here
    // For demo, we'll show the link directly
    const resetUrl = `/reset-password/${resetToken}`;

    // For production with email (uncomment and configure nodemailer):
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({
    //   to: user.email,
    //   subject: 'Password Reset Request',
    //   html: `<p>Click <a href="${process.env.BASE_URL}${resetUrl}">here</a> to reset your password.</p>`
    // });

    req.flash('success', `Password reset link generated! For demo purposes, click here: <a href="${resetUrl}" style="color: #667eea; font-weight: bold;">Reset Password</a>`);
    res.redirect('/forgot-password');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/forgot-password');
  }
});

router.get('/reset-password/:token', async (req, res) => {
  try {
    const crypto = require('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { token: req.params.token, error: null, success: null });
  } catch (err) {
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/forgot-password');
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const crypto = require('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('reset-password', {
        token: req.params.token,
        error: 'Password reset link is invalid or has expired.',
        success: null
      });
    }

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('reset-password', {
        token: req.params.token,
        error: 'Passwords do not match.',
        success: null
      });
    }

    if (password.length < 6) {
      return res.render('reset-password', {
        token: req.params.token,
        error: 'Password must be at least 6 characters.',
        success: null
      });
    }

    // Update password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success', 'Password reset successful! You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Reset password error:', err);
    res.render('reset-password', {
      token: req.params.token,
      error: 'Something went wrong. Please try again.',
      success: null
    });
  }
});

router.get('/user/:id', auth, async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!profileUser) {
      return res.redirect('/');
    }

    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isFollowing = profileUser.followers.some(
      f => f._id.toString() === req.user._id.toString()
    );

    // Only fetch posts if user can view them (own profile, public account, or following)
    const canViewPosts = isOwnProfile || !profileUser.isPrivate || isFollowing;
    let posts = [];

    if (canViewPosts) {
      posts = await Post.find({ user: req.params.id, isArchived: false })
        .sort({ createdAt: -1 });
    }

    res.render('profile', {
      profileUser,
      user: req.user,
      posts,
      isFollowing,
      isOwnProfile,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length
    });
  } catch (err) {
    console.error('Profile Error:', err);
    res.redirect('/');
  }
});

router.get('/settings', auth, (req, res) => {
  res.render('settings', { user: req.user });
});

router.post('/settings', auth, upload.single('avatar'), profileValidation, validate, async (req, res) => {
  try {
    const { username, email, name, bio, website } = req.body;
    let updateData = {
      username: username?.toLowerCase(),
      email,
      name,
      bio,
      website
    };

    // Handle social links
    if (req.body['socialLinks[twitter]'] || req.body['socialLinks[instagram]'] ||
      req.body['socialLinks[youtube]'] || req.body['socialLinks[linkedin]']) {
      updateData.socialLinks = {
        twitter: req.body['socialLinks[twitter]'] || '',
        instagram: req.body['socialLinks[instagram]'] || '',
        youtube: req.body['socialLinks[youtube]'] || '',
        linkedin: req.body['socialLinks[linkedin]'] || ''
      };
    }

    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      updateData.avatar = result.secure_url;
    }

    await User.findByIdAndUpdate(req.user._id, updateData);
    res.redirect(`/user/${req.user._id}`);
  } catch (err) {
    if (err.code === 11000) {
      req.flash('error', 'Username already taken.');
    }
    res.redirect('/settings');
  }
});

router.post('/settings/privacy', auth, async (req, res) => {
  try {
    const updateData = {
      isPrivate: req.body.isPrivate === 'on',
      showActivityStatus: req.body.showActivityStatus === 'on',
      allowTags: req.body.allowTags === 'on'
    };

    await User.findByIdAndUpdate(req.user._id, updateData);
    req.flash('success', 'Privacy settings updated');
    res.redirect('/settings');
  } catch (err) {
    console.error('Privacy Settings Error:', err);
    res.redirect('/settings');
  }
});

router.post('/settings/notifications', auth, async (req, res) => {
  try {
    const notificationSettings = {
      pushEnabled: req.body.pushEnabled === 'on',
      emailEnabled: req.body.emailEnabled === 'on',
      likes: req.body.likes === 'on',
      comments: req.body.comments === 'on',
      follows: req.body.follows === 'on',
      messages: req.body.messages === 'on'
    };

    await User.findByIdAndUpdate(req.user._id, { notificationSettings });
    req.flash('success', 'Notification settings updated');
    res.redirect('/settings');
  } catch (err) {
    console.error('Notification Settings Error:', err);
    res.redirect('/settings');
  }
});

router.post('/settings/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/settings');
    }

    if (newPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/settings');
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/settings');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    req.flash('success', 'Password changed successfully');
    res.redirect('/settings');
  } catch (err) {
    console.error('Change Password Error:', err);
    req.flash('error', 'Failed to change password');
    res.redirect('/settings');
  }
});

router.post('/settings/delete-account', auth, async (req, res) => {
  try {
    // Delete user's posts
    await Post.deleteMany({ user: req.user._id });

    // Remove user from followers/following of other users
    await User.updateMany(
      { followers: req.user._id },
      { $pull: { followers: req.user._id } }
    );
    await User.updateMany(
      { following: req.user._id },
      { $pull: { following: req.user._id } }
    );

    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.clearCookie('token');
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Account Error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.post('/user/:id/block', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't block yourself" });
    }

    // Add to blocked users
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: { following: targetUserId, followers: targetUserId }
    });

    // Remove from their followers/following too
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { following: req.user._id, followers: req.user._id }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Block User Error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/user/:id/unblock', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.id }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Unblock User Error:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.post('/user/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
    }

    // Return JSON for AJAX requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      const updatedUser = await User.findById(targetUserId);
      return res.json({
        success: true,
        isFollowing: !isFollowing,
        followerCount: updatedUser.followers.length
      });
    }

    res.redirect(`/user/${targetUserId}`);
  } catch (err) {
    console.error('Follow Error:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.length < 2) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ users: [] });
      }
      return res.render('search', { users: [], query: '', user: req.user });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username name avatar followers isVerified isPrivate')
      .limit(20);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ users });
    }

    res.render('search', { users, query, user: req.user });
  } catch (err) {
    console.error('Search Error:', err);
    res.json({ users: [] });
  }
});

router.get('/user/:id/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username name avatar');

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ followers: user.followers });
    }

    res.render('followers', {
      profileUser: user,
      followers: user.followers,
      user: req.user,
      type: 'followers'
    });
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/user/:id/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username name avatar');

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ following: user.following });
    }

    res.render('followers', {
      profileUser: user,
      followers: user.following,
      user: req.user,
      type: 'following'
    });
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/suggested', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('following');
    const followingIds = currentUser.following.map(u => u._id);

    // Get users that your friends follow but you don't
    const friendsOfFriends = await User.aggregate([
      { $match: { _id: { $in: followingIds } } },
      { $unwind: '$following' },
      {
        $match: {
          following: {
            $nin: [...followingIds, req.user._id]
          }
        }
      },
      {
        $group: {
          _id: '$following',
          mutualCount: { $sum: 1 }
        }
      },
      { $sort: { mutualCount: -1 } },
      { $limit: 15 }
    ]);

    const suggestedIds = friendsOfFriends.map(u => u._id);

    // Get full user data
    let suggested = await User.find({
      _id: { $in: suggestedIds },
      isBanned: { $ne: true },
      isDeactivated: { $ne: true }
    }).select('username name avatar bio followers isVerified');

    // If not enough suggestions, add random users
    if (suggested.length < 10) {
      const randomUsers = await User.find({
        _id: { $nin: [...followingIds, req.user._id, ...suggestedIds] },
        isBanned: { $ne: true },
        isDeactivated: { $ne: true }
      })
        .select('username name avatar bio followers isVerified')
        .limit(10 - suggested.length);

      suggested = [...suggested, ...randomUsers];
    }

    // Add mutual friend count
    const mutualMap = new Map(friendsOfFriends.map(f => [f._id.toString(), f.mutualCount]));
    const suggestedWithMutuals = suggested.map(u => ({
      ...u.toObject(),
      mutualCount: mutualMap.get(u._id.toString()) || 0
    }));

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ suggested: suggestedWithMutuals });
    }

    res.render('suggested', { suggested: suggestedWithMutuals, user: req.user });
  } catch (err) {
    console.error('Suggested Users Error:', err);
    res.json({ suggested: [] });
  }
});

router.get('/activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    const loginHistory = user.loginHistory || [];

    // Sort by most recent
    loginHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render('activity', {
      loginHistory: loginHistory.slice(0, 20),
      user: req.user
    });
  } catch (err) {
    res.redirect('/settings');
  }
});

const VerificationRequest = require('../models/VerificationRequest');

router.get('/verify/request', auth, async (req, res) => {
  try {
    // Check if user already has pending request
    const existing = await VerificationRequest.findOne({
      user: req.user._id,
      status: 'pending'
    });

    res.render('verify-request', {
      user: req.user,
      pendingRequest: existing,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    res.redirect('/settings');
  }
});

router.post('/verify/request', auth, upload.single('idDocument'), async (req, res) => {
  try {
    // Check if already verified
    if (req.user.isVerified) {
      req.flash('error', 'You are already verified!');
      return res.redirect('/verify/request');
    }

    // Check for existing pending request
    const existing = await VerificationRequest.findOne({
      user: req.user._id,
      status: 'pending'
    });

    if (existing) {
      req.flash('error', 'You already have a pending verification request.');
      return res.redirect('/verify/request');
    }

    const { fullName, category, reason, links } = req.body;

    let idDocumentUrl = null;
    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      idDocumentUrl = result.secure_url;
    }

    const request = new VerificationRequest({
      user: req.user._id,
      fullName,
      category,
      reason,
      links: links ? links.split('\n').filter(l => l.trim()) : [],
      idDocument: idDocumentUrl
    });

    await request.save();

    req.flash('success', 'Your verification request has been submitted! We will review it within 7 days.');
    res.redirect('/verify/request');
  } catch (err) {
    console.error('Verification Request Error:', err);
    req.flash('error', 'Failed to submit request. Please try again.');
    res.redirect('/verify/request');
  }
});

router.get('/search/all', auth, async (req, res) => {
  try {
    const query = req.query.q;
    const type = req.query.type || 'all';

    if (!query || query.length < 2) {
      return res.json({ users: [], posts: [], hashtags: [] });
    }

    const results = { users: [], posts: [], hashtags: [] };

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username name avatar followers isVerified isPrivate')
        .limit(10);
    }

    // Search posts by caption
    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        caption: { $regex: query, $options: 'i' },
        isArchived: false
      })
        .populate('user', 'username avatar')
        .select('image caption likes comments')
        .limit(12);
    }

    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      const hashtagResults = await Post.aggregate([
        { $match: { isArchived: false } },
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $regex: query, $options: 'i' } } },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      results.hashtags = hashtagResults;
    }

    res.json(results);
  } catch (err) {
    console.error('Enhanced Search Error:', err);
    res.json({ users: [], posts: [], hashtags: [] });
  }
});

module.exports = router;