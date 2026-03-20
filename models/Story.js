const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  // Story owner
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Story content
  media: { type: String, required: true }, // Image/Video URL
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, maxlength: 500 },
  
  // Interactive elements
  stickers: [{
    type: { type: String, enum: ['text', 'mention', 'hashtag', 'poll', 'question', 'link'] },
    content: String,
    position: { x: Number, y: Number },
    style: mongoose.Schema.Types.Mixed
  }],
  
  // Poll data
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
  },
  
  // Question responses
  questionResponses: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    response: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Views
  views: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  
  // Reactions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Privacy
  closeFriendsOnly: { type: Boolean, default: false },
  hiddenFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Highlight
  isHighlight: { type: Boolean, default: false },
  highlightName: String,
  
  // Expiration (24 hours from creation, or permanent if highlight)
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 } // TTL index - auto delete when expired (unless highlight)
  },
  
  // Music (optional)
  music: {
    title: String,
    artist: String,
    previewUrl: String
  }
  
}, { timestamps: true });

storySchema.pre('save', async function() {
  if (this.isHighlight) {
    this.expiresAt = undefined;
  }
});

storySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
