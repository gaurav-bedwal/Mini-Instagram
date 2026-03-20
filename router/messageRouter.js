const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Message.find({
      participants: req.user.id
    })
    .populate('participants', 'username avatar isOnline lastActive')
    .populate('lastMessage.sender', 'username')
    .sort({ 'lastMessage.createdAt': -1 });
    
    // Count unread
    let unreadCount = 0;
    conversations.forEach(conv => {
      const unreadMessages = conv.messages.filter(m => 
        !m.readBy.includes(req.user.id) && 
        m.sender.toString() !== req.user.id
      );
      unreadCount += unreadMessages.length;
    });
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ conversations, unreadCount });
    }
    
    res.render('messages/inbox', { 
      user: req.user, 
      conversations,
      unreadCount
    });
  } catch (err) {
    console.error('Inbox Error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if blocked
    if (req.user.blockedUsers?.includes(req.params.userId) || 
        otherUser.blockedUsers?.includes(req.user.id)) {
      return res.status(403).json({ error: 'Cannot message this user' });
    }
    
    // Find existing conversation or create new
    let conversation = await Message.findOne({
      participants: { $all: [req.user.id, req.params.userId] },
      isGroupChat: false
    }).populate('participants', 'username avatar isOnline lastActive')
      .populate('messages.sender', 'username avatar');
    
    if (!conversation) {
      conversation = new Message({
        participants: [req.user.id, req.params.userId],
        messages: [],
        isGroupChat: false
      });
      await conversation.save();
      await conversation.populate('participants', 'username avatar isOnline lastActive');
    }
    
    // Mark messages as read
    conversation.messages.forEach(m => {
      if (!m.readBy.includes(req.user.id)) {
        m.readBy.push(req.user.id);
      }
    });
    await conversation.save();
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ conversation, otherUser });
    }
    
    res.render('messages/conversation', { 
      user: req.user, 
      conversation,
      otherUser
    });
  } catch (err) {
    console.error('Conversation Error:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

router.post('/send/:conversationId', auth, async (req, res) => {
  try {
    const { content, messageType = 'text', attachment } = req.body;
    
    if (!content && !attachment) {
      return res.status(400).json({ error: 'Message content required' });
    }
    
    const conversation = await Message.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const newMessage = {
      sender: req.user.id,
      content,
      messageType,
      attachment,
      readBy: [req.user.id],
      createdAt: new Date()
    };
    
    conversation.messages.push(newMessage);
    conversation.lastMessage = {
      content: content || '[Attachment]',
      sender: req.user.id,
      createdAt: new Date()
    };
    
    await conversation.save();
    
    // Create notification for other participants
    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== req.user.id
    );
    
    for (const recipientId of otherParticipants) {
      const recipient = await User.findById(recipientId);
      if (recipient?.notificationSettings?.messages !== false) {
        await Notification.create({
          recipient: recipientId,
          sender: req.user.id,
          type: 'message',
          message: content.substring(0, 100),
          link: `/messages/conversation/${req.user.id}`
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: newMessage 
    });
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.delete('/message/:conversationId/:messageIndex', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messageIndex = parseInt(req.params.messageIndex);
    const message = conversation.messages[messageIndex];
    
    if (!message || message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }
    
    conversation.messages.splice(messageIndex, 1);
    await conversation.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Message Error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

router.delete('/conversation/:id', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Conversation Error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json({ users: [] });
    }
    
    const users = await User.find({
      _id: { $ne: req.user.id },
      username: { $regex: query, $options: 'i' },
      isBanned: { $ne: true },
      isDeactivated: { $ne: true },
      blockedUsers: { $ne: req.user.id }
    })
    .select('username avatar isOnline')
    .limit(10);
    
    // Filter out users who blocked current user
    const filteredUsers = users.filter(u => 
      !req.user.blockedUsers?.includes(u._id)
    );
    
    res.json({ users: filteredUsers });
  } catch (err) {
    console.error('Search Users Error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.post('/read/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    conversation.messages.forEach(m => {
      if (!m.readBy.includes(req.user.id)) {
        m.readBy.push(req.user.id);
      }
    });
    
    await conversation.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Mark Read Error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
