const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, required: true },
  avatar: String,
  bio: { type: String, maxlength: 150 },
  
  // Role & Status
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isPrivate: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isShadowBanned: { type: Boolean, default: false },
  isDeactivated: { type: Boolean, default: false },
  
  // Profile Links
  website: { type: String, trim: true },
  socialLinks: {
    twitter: String,
    youtube: String,
    tiktok: String,
    linkedin: String
  },
  
  // Profile Customization
  profileTheme: {
    primaryColor: { type: String, default: '#0095f6' },
    backgroundColor: { type: String, default: '#ffffff' }
  },
  
  // Relationships
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingFollowRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Content
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  taggedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Activity & Privacy
  lastLogin: { type: Date },
  lastActive: { type: Date },
  showActivityStatus: { type: Boolean, default: true },
  
  // Notification Preferences
  notificationSettings: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false }
  },
  
  // Login History
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    location: String
  }],
  
  // Banning Info
  banReason: String,
  bannedAt: Date,
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bannedIPs: [String]
  
}, { timestamps: true });

userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.index({ username: 'text', name: 'text' });

module.exports = mongoose.model('User', userSchema);