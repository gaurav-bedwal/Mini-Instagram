const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who receives the notification
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Who triggered the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Notification type
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'follow_request', 'mention', 'message', 'tag', 'system', 'report_resolved'],
    required: true
  },
  
  // Related content
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: String,
  message: String,
  
  // Custom message for system notifications
  title: String,
  body: String,
  
  // Status
  isRead: { type: Boolean, default: false },
  
  // Link to redirect when clicked
  link: String
  
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
