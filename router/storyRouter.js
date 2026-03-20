const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const Highlight = require('../models/Highlight');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../utils/multer');
const { uploadImage } = require('../utils/cloudinary');

const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const following = user.following || [];

    // Ensure all items are proper ObjectIds for the native aggregate $match pipeline
    const usersToShow = [...following, req.user.id].map(id => new mongoose.Types.ObjectId(id));

    // Get active stories (not expired)
    const stories = await Story.aggregate([
      {
        $match: {
          user: { $in: usersToShow },
          $or: [
            { expiresAt: { $gt: new Date() } },
            { isHighlight: true }
          ],
          hiddenFrom: { $ne: req.user.id }
        }
      },
      {
        $group: {
          _id: '$user',
          stories: { $push: '$$ROOT' },
          latestStory: { $max: '$createdAt' }
        }
      },
      { $sort: { latestStory: -1 } }
    ]);

    // Populate user info
    const populatedStories = await User.populate(stories, {
      path: '_id',
      select: 'username avatar'
    });

    // Add hasUnviewed flag
    const storiesWithStatus = populatedStories.map(group => {
      const hasUnviewed = group.stories.some(s =>
        !s.views?.some(v => v.user?.toString() === req.user.id)
      );
      return {
        user: group._id,
        stories: group.stories,
        hasUnviewed
      };
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ stories: storiesWithStatus });
    }

    res.render('stories/feed', {
      user: req.user,
      storyGroups: storiesWithStatus
    });
  } catch (err) {
    console.error('Stories Feed Error:', err);
    res.status(500).json({ error: 'Failed to load stories' });
  }
});

router.get('/new', auth, (req, res) => {
  res.render('stories/new', { user: req.user });
});

router.post('/', auth, upload.single('media'), async (req, res) => {
  console.log('== incoming story POST ==');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  try {
    if (!req.file) {
      console.log('Failed: Media is required');
      return res.status(400).json({ error: 'Media is required' });
    }

    const result = await uploadImage(req.file.path);

    const story = new Story({
      user: req.user.id,
      media: result.secure_url,
      mediaType: req.body.mediaType || 'image',
      caption: req.body.caption,
      closeFriendsOnly: req.body.closeFriendsOnly === 'true'
    });

    // Add stickers if provided
    if (req.body.stickers) {
      story.stickers = JSON.parse(req.body.stickers);
    }

    // Add poll if provided
    if (req.body.pollQuestion && req.body.pollOptions) {
      story.poll = {
        question: req.body.pollQuestion,
        options: JSON.parse(req.body.pollOptions).map(text => ({
          text,
          votes: []
        }))
      };
    }

    await story.save();

    res.json({ success: true, storyId: story._id });
  } catch (err) {
    console.error('Create Story Error:', err);
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('views.user', 'username avatar')
      .populate('reactions.user', 'username avatar');

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if close friends only
    if (story.closeFriendsOnly) {
      const storyOwner = await User.findById(story.user._id || story.user);
      if (!storyOwner.closeFriends?.includes(req.user.id) &&
        story.user._id?.toString() !== req.user.id &&
        story.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'This story is for close friends only' });
      }
    }

    // Check if hidden from this user
    if (story.hiddenFrom?.includes(req.user.id)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Add view if not already viewed (and not own story)
    const storyUserId = story.user._id?.toString() || story.user.toString();
    if (storyUserId !== req.user.id) {
      const hasViewed = story.views.some(v =>
        (v.user?._id || v.user)?.toString() === req.user.id
      );

      if (!hasViewed) {
        story.views.push({ user: req.user.id });
        await story.save();
      }
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ story });
    }

    res.render('stories/view', { user: req.user, story });
  } catch (err) {
    console.error('View Story Error:', err);
    res.status(500).json({ error: 'Failed to load story' });
  }
});

router.post('/:id/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Remove existing reaction from this user
    story.reactions = story.reactions.filter(r =>
      r.user.toString() !== req.user.id
    );

    // Add new reaction
    story.reactions.push({ user: req.user.id, emoji });
    await story.save();

    // Notify story owner
    const storyUserId = story.user.toString();
    if (storyUserId !== req.user.id) {
      await Notification.create({
        recipient: storyUserId,
        sender: req.user.id,
        type: 'like',
        body: `reacted ${emoji} to your story`,
        link: `/stories/${story._id}`
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('React to Story Error:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
});

router.post('/:id/poll/:optionIndex', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story || !story.poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const optionIndex = parseInt(req.params.optionIndex);
    if (optionIndex < 0 || optionIndex >= story.poll.options.length) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Remove previous vote
    story.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== req.user.id);
    });

    // Add new vote
    story.poll.options[optionIndex].votes.push(req.user.id);
    await story.save();

    res.json({ success: true, poll: story.poll });
  } catch (err) {
    console.error('Poll Vote Error:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

router.post('/:id/question', auth, async (req, res) => {
  try {
    const { response } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    story.questionResponses.push({
      user: req.user.id,
      response
    });
    await story.save();

    // Notify story owner
    await Notification.create({
      recipient: story.user.toString(),
      sender: req.user.id,
      type: 'comment',
      body: `answered your question: "${response.substring(0, 50)}"`,
      link: `/stories/${story._id}`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Question Response Error:', err);
    res.status(500).json({ error: 'Failed to respond' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Story Error:', err);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

router.get('/:id/viewers', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('views.user', 'username avatar');

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ viewers: story.views });
  } catch (err) {
    console.error('Get Viewers Error:', err);
    res.status(500).json({ error: 'Failed to get viewers' });
  }
});

router.post('/:id/highlight', auth, async (req, res) => {
  try {
    const { highlightId, highlightName } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story || story.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    story.isHighlight = true;
    story.expiresAt = undefined;
    await story.save();

    if (highlightId) {
      // Add to existing highlight
      await Highlight.findByIdAndUpdate(highlightId, {
        $addToSet: { stories: story._id }
      });
    } else if (highlightName) {
      // Create new highlight
      await Highlight.create({
        user: req.user.id,
        name: highlightName,
        coverImage: story.media,
        stories: [story._id]
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Add to Highlight Error:', err);
    res.status(500).json({ error: 'Failed to add to highlight' });
  }
});

router.get('/highlights/:userId', auth, async (req, res) => {
  try {
    const highlights = await Highlight.find({ user: req.params.userId })
      .populate('stories');

    res.json({ highlights });
  } catch (err) {
    console.error('Get Highlights Error:', err);
    res.status(500).json({ error: 'Failed to get highlights' });
  }
});

module.exports = router;
