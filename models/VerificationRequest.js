const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  // Requesting user
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Full legal name
  fullName: { type: String, required: true, trim: true },
  
  // Category
  category: {
    type: String,
    enum: ['creator', 'business', 'government', 'media', 'entertainment', 'sports', 'other'],
    required: true
  },
  
  // Reason for request
  reason: { type: String, required: true, maxlength: 1000 },
  
  // Links to prove identity
  links: [{
    type: String,
    trim: true
  }],
  
  // ID document (URL)
  idDocument: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin notes (internal)
  adminNotes: String,
  
  // Reviewed by
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  
  // Rejection reason (shown to user)
  rejectionReason: String

}, { timestamps: true });

verificationRequestSchema.index({ user: 1, status: 1 });
verificationRequestSchema.index({ status: 1, createdAt: -1 });

verificationRequestSchema.index({ user: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'pending' } 
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
