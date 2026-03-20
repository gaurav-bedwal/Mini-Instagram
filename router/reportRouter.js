const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');


router.post('/post/:postId', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check for duplicate report
    const existingReport = await Report.findOne({
      reporter: req.user.id,
      reportedPost: req.params.postId,
      status: { $in: ['pending', 'reviewing'] }
    });
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }
    
    const report = await Report.create({
      reporter: req.user.id,
      reportType: 'post',
      reportedPost: req.params.postId,
      reportedUser: post.user,
      reason,
      description
    });
    
    res.json({ success: true, reportId: report._id });
  } catch (err) {
    console.error('Report Post Error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.post('/user/:userId', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }
    
    // Check for duplicate report
    const existingReport = await Report.findOne({
      reporter: req.user.id,
      reportedUser: req.params.userId,
      reportType: 'user',
      status: { $in: ['pending', 'reviewing'] }
    });
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this user' });
    }
    
    const report = await Report.create({
      reporter: req.user.id,
      reportType: 'user',
      reportedUser: req.params.userId,
      reason,
      description
    });
    
    res.json({ success: true, reportId: report._id });
  } catch (err) {
    console.error('Report User Error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.post('/comment/:postId', auth, async (req, res) => {
  try {
    const { reason, description, commentText } = req.body;
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const report = await Report.create({
      reporter: req.user.id,
      reportType: 'comment',
      reportedComment: {
        postId: req.params.postId,
        commentText
      },
      reason,
      description
    });
    
    res.json({ success: true, reportId: report._id });
  } catch (err) {
    console.error('Report Comment Error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reportedUser', 'username avatar')
      .populate('reportedPost', 'title image')
      .sort({ createdAt: -1 });
    
    res.json({ reports });
  } catch (err) {
    console.error('Get My Reports Error:', err);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});


router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const query = status === 'all' ? {} : { status };
    
    const reports = await Report.find(query)
      .populate('reporter', 'username avatar')
      .populate('reportedUser', 'username avatar email')
      .populate('reportedPost', 'title image user')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalReports = await Report.countDocuments(query);
    const pendingCount = await Report.countDocuments({ status: 'pending' });
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ 
        reports, 
        totalReports, 
        pendingCount,
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit)
      });
    }
    
    res.render('admin/reports', { 
      user: req.user, 
      reports, 
      currentStatus: status,
      pendingCount,
      currentPage: page,
      totalPages: Math.ceil(totalReports / limit)
    });
  } catch (err) {
    console.error('Get All Reports Error:', err);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

router.post('/admin/:id/review', auth, isAdmin, async (req, res) => {
  try {
    const { status, actionTaken, adminNotes, resolution } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    report.actionTaken = actionTaken;
    report.adminNotes = adminNotes;
    report.resolution = resolution;
    
    await report.save();
    
    // Take action based on decision
    if (actionTaken === 'content_removed' && report.reportedPost) {
      await Post.findByIdAndUpdate(report.reportedPost, { isArchived: true });
    } else if (actionTaken === 'user_banned' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, {
        isBanned: true,
        banReason: resolution || 'Violated community guidelines',
        bannedAt: new Date(),
        bannedBy: req.user.id
      });
    } else if (actionTaken === 'warning' && report.reportedUser) {
      // Send warning notification
      await Notification.create({
        recipient: report.reportedUser,
        type: 'system',
        title: 'Warning',
        body: resolution || 'You have received a warning for violating community guidelines.'
      });
    }
    
    // Notify reporter of resolution
    if (status === 'resolved' || status === 'dismissed') {
      await Notification.create({
        recipient: report.reporter,
        type: 'report_resolved',
        title: 'Report Update',
        body: `Your report has been ${status}. ${resolution || ''}`
      });
    }
    
    // Create audit log
    await AuditLog.create({
      admin: req.user.id,
      action: status === 'resolved' ? 'report_resolved' : 'report_dismissed',
      targetType: 'report',
      targetId: report._id,
      details: { actionTaken, status },
      reason: resolution,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Review Report Error:', err);
    res.status(500).json({ error: 'Failed to review report' });
  }
});

router.get('/admin/stats', auth, isAdmin, async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const byReason = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const byType = await Report.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reporter', 'username')
      .populate('reportedUser', 'username');
    
    res.json({ 
      byStatus: stats, 
      byReason, 
      byType,
      recentReports
    });
  } catch (err) {
    console.error('Get Report Stats Error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
