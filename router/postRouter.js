const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../utils/multer');
const { uploadImage } = require('../utils/cloudinary');
const { postValidation, commentValidation, validate } = require('../middleware/validators');

router.get('/post/new', auth, (req, res) => {
  res.render('newpost', { user: req.user });
});

router.post('/post', auth, upload.single('image'), postValidation, validate, async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Image is required');
      return res.redirect('/post/new');
    }

    // Upload image to Cloudinary with optimization
    const result = await uploadImage(req.file.path);
    const imageUrl = result.secure_url;

    // Determine if it's a video
    const isVideo = req.file.mimetype.startsWith('video/');

    // Create and save the post
    const newPost = new Post({
      user: req.user.id,
      title: req.body.title,
      image: imageUrl,
      mediaType: isVideo ? 'video' : 'image',
      caption: req.body.caption,
      location: req.body.location
    });

    await newPost.save();

    // Return JSON for AJAX or redirect
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, postId: newPost._id });
    }
    res.redirect('/');
  } catch (err) {
    console.error('Create Post Error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
    res.render('newpost', { error: `Failed to create post: ${err.message}`, user: req.user });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ isArchived: false });
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find({ isArchived: false })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // For infinite scroll API
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        posts,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages
      });
    }

    res.render('index', {
      posts,
      user: req.user,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error('Home Route Error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Failed to load posts' });
    }
    res.render('index', { posts: [], user: req.user, error: 'Failed to load posts', currentPage: 1, totalPages: 1 });
  }
});

router.post('/post/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const isLiked = post.likes.some(id => id.toString() === userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    // Return JSON for AJAX (double-tap like)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        liked: !isLiked,
        likeCount: post.likes.length
      });
    }

    res.redirect(req.get('Referer') || '/');
  } catch (err) {
    console.error('Like Error:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.post('/post/:id/comment', auth, commentValidation, validate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      text: req.body.comment,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Return JSON for AJAX
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        comment: newComment,
        commentCount: post.comments.length
      });
    }

    // Redirect back to the post page
    const referer = req.get('Referer');
    res.redirect(referer || `/post/${req.params.id}`);
  } catch (err) {
    console.error('Comment Error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.post('/post/:id/delete', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    res.redirect('/');
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.get('/post/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar');

    if (!post) {
      return res.redirect('/');
    }

    const isSaved = req.user.savedPosts?.includes(req.params.id);
    const isLiked = post.likes.some(id => id.toString() === req.user._id.toString());

    res.render('viewpost', {
      post,
      user: req.user,
      isSaved,
      isLiked
    });
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/post/:id/edit', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }
    res.render('editpost', { post, user: req.user });
  } catch (err) {
    res.redirect('/');
  }
});

router.post('/post/:id/edit', auth, upload.single('image'), postValidation, validate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    let updateData = {
      caption: req.body.caption,
      title: req.body.title
    };

    if (req.file) {
      const result = await uploadImage(req.file.path);
      updateData.image = result.secure_url;
    }

    // Re-extract hashtags
    if (updateData.caption) {
      const hashtagRegex = /#(\w+)/g;
      const matches = updateData.caption.match(hashtagRegex);
      updateData.hashtags = matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
    }

    await Post.findByIdAndUpdate(req.params.id, updateData);
    res.redirect(`/post/${req.params.id}`);
  } catch (err) {
    res.redirect('/');
  }
});

router.post('/post/:id/save', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isSaved = user.savedPosts?.includes(postId);

    if (isSaved) {
      await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } });
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, saved: !isSaved });
    }

    res.redirect(req.get('Referer') || '/');
  } catch (err) {
    console.error('Save Error:', err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'user', select: 'username avatar' }
    });

    res.render('saved', {
      posts: user.savedPosts || [],
      user: req.user
    });
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/explore', auth, async (req, res) => {
  try {
    const hashtag = req.query.tag;
    let posts;

    if (hashtag) {
      posts = await Post.find({
        hashtags: hashtag.toLowerCase(),
        isArchived: false
      })
        .populate('user', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      // Get trending/recent posts
      posts = await Post.find({ isArchived: false })
        .populate('user', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    // Get trending hashtags
    const trendingHashtags = await Post.aggregate([
      { $match: { isArchived: false, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ posts, trendingHashtags });
    }

    res.render('explore', { posts, user: req.user, hashtag, trendingHashtags: trendingHashtags.map(t => t._id) });
  } catch (err) {
    console.error('Explore Error:', err);
    res.redirect('/');
  }
});

router.get('/hashtag/:tag', auth, async (req, res) => {
  try {
    const hashtag = req.params.tag.toLowerCase().replace(/^#/, '');

    const posts = await Post.find({
      hashtags: hashtag,
      isArchived: false
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    // Get related hashtags (hashtags that appear with this one)
    const relatedTags = await Post.aggregate([
      { $match: { hashtags: hashtag, isArchived: false } },
      { $unwind: '$hashtags' },
      { $match: { hashtags: { $ne: hashtag } } },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    res.render('hashtag', {
      hashtag,
      posts,
      relatedTags: relatedTags.map(t => t._id),
      user: req.user
    });
  } catch (err) {
    console.error('Hashtag Error:', err);
    res.redirect('/explore');
  }
});

router.get('/api/posts', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ isArchived: false });
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find({ isArchived: false })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add isLiked and isSaved flags
    const postsWithFlags = posts.map(post => ({
      ...post,
      isLiked: post.likes.some(id => id.toString() === req.user._id.toString()),
      isSaved: req.user.savedPosts?.some(id => id.toString() === post._id.toString()),
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({
      posts: postsWithFlags,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages
    });
  } catch (err) {
    console.error('API Posts Error:', err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

module.exports = router;