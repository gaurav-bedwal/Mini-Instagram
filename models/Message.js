const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Messages in the conversation
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    messageType: { type: String, enum: ['text', 'image', 'post'], default: 'text' },
    attachment: String, // URL for images or post ID
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Last message for preview
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  },
  
  // Conversation metadata
  isGroupChat: { type: Boolean, default: false },
  groupName: String,
  groupAvatar: String,
  
  // Typing indicators (user IDs currently typing)
  typingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  
}, { timestamps: true });

messageSchema.index({ participants: 1 });
messageSchema.index({ 'lastMessage.createdAt': -1 });

module.exports = mongoose.model('Message', messageSchema);
