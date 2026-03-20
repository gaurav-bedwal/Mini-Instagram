const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
  // Appellant
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Appeal details
  reason: { type: String, required: true, maxlength: 2000 },
  
  // Original ban info
  banReason: String,
  bannedAt: Date,
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: String,
  
  // If approved
  unbanDate: Date
  
}, { timestamps: true });

appealSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Appeal', appealSchema);
