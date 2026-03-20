const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'username avatar')
      .populate('post', 'image title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });
    
    const totalCount = await Notification.countDocuments({ recipient: req.user.id });
    const hasMore = skip + notifications.length < totalCount;
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ notifications, unreadCount, hasMore });
    }
    
    res.render('notifications', { 
      user: req.user, 
      notifications,
      unreadCount,
      currentPage: page,
      hasMore
    });
  } catch (err) {
    console.error('Notifications Error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get count' });
  }
});

router.post('/read/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark Read Error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark All Read Error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Notification Error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

router.delete('/clear/all', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Clear Notifications Error:', err);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

router.createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (err) {
    console.error('Create Notification Error:', err);
    return null;
  }
};

module.exports = router;
