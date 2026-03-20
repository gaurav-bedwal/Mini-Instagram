const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Action type
  action: {
    type: String,
    enum: [
      // User actions
      'user_banned',
      'user_unbanned',
      'user_verified',
      'user_unverified',
      'user_role_changed',
      'user_deleted',
      'user_shadowbanned',
      'user_unshadowbanned',
      'user_ip_banned',
      
      // Post actions
      'post_deleted',
      'post_archived',
      'post_restored',
      
      // Report actions
      'report_reviewed',
      'report_dismissed',
      'report_resolved',
      
      // System actions
      'system_announcement',
      'feature_flag_changed',
      'backup_created',
      'settings_changed',
      
      // Message actions
      'message_deleted',
      'conversation_deleted'
    ],
    required: true
  },
  
  // Target of the action
  targetType: { type: String, enum: ['user', 'post', 'report', 'message', 'system'] },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetUsername: String, // For easier display
  
  // Details
  details: mongoose.Schema.Types.Mixed,
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  reason: String,
  
  // Request info
  ipAddress: String,
  userAgent: String
  
}, { timestamps: true });

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
