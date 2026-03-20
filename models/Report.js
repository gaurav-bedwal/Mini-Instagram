const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Who reported
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // What was reported
  reportType: {
    type: String,
    enum: ['post', 'comment', 'user', 'message', 'story'],
    required: true
  },
  
  // References to reported content
  reportedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedComment: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    commentText: String
  },
  reportedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reportedStory: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  
  // Report details
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'false_information',
      'scam',
      'copyright',
      'self_harm',
      'other'
    ],
    required: true
  },
  description: { type: String, maxlength: 1000 },
  
  // Evidence/screenshots
  evidence: [String], // URLs
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Admin handling
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  resolution: String,
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'user_banned', 'user_suspended'],
  },
  adminNotes: String
  
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);
