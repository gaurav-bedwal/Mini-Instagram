const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true },
  image: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, maxlength: 2200 }, // Instagram caption limit
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    text: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],
  hashtags: [{ type: String, lowercase: true, trim: true }],
  location: String,
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

postSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });

postSchema.pre('save', function () {
  if (this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    if (matches) {
      this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
    }
  }
});

module.exports = mongoose.model('Post', postSchema);
