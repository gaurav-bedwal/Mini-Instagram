const mongoose = require('mongoose');


const announcementSchema = new mongoose.Schema({

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  
  // Display settings
  showBanner: { type: Boolean, default: true },
  bannerColor: { type: String, default: '#0095f6' },
  
  // Targeting
  targetRoles: [{ type: String, enum: ['user', 'admin', 'moderator', 'all'], default: 'all' }],
  
  // Scheduling
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Dismissals
  dismissedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
