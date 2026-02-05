import express from 'express';
import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import TopicRequest from '../models/TopicRequest.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, topics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch topics' });
  }
});

// Create a new topic (admin only)
router.post('/topics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const topic = new Topic({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.userId
    });

    await topic.save();
    res.status(201).json({ success: true, topic });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Topic name already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create topic' });
    }
  }
});

// Update a topic (admin only)
router.put('/topics/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (name) topic.name = name.trim();
    if (description !== undefined) topic.description = description.trim();
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();
    res.json({ success: true, topic });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update topic' });
  }
});

// Delete a topic (admin only)
router.delete('/topics/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Delete all posts in this topic (by both topic ID and topicName for safety)
    await Post.deleteMany({ 
      $or: [
        { topic: req.params.id },
        { topicName: topic.name }
      ]
    });
    
    // Delete the topic itself
    await Topic.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Topic and all its posts deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
});

// Get posts for a specific topic
router.get('/topics/:topicId/posts', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // First get the topic to get the topic name
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    
    const posts = await Post.find({ topicName: topic.name })
      .populate('author', 'name alias')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ topicName: topic.name });
    
    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/topics/:topicId/posts', requireAuth, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the topic to get the topic name
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    console.log('[Create Post] Creating new post...');
    console.log('[Create Post] Content length:', content.trim().length, 'characters');
    console.log('[Create Post] Word count:', content.trim().split(/\s+/).filter(w => w.length > 0).length);
    
    const post = new Post({
      content: content.trim(),
      author: req.userId,
      authorName: user.alias || user.name,
      topic: topicId,
      topicName: topic.name
    });

    console.log('[Create Post] Post object created, saving...');
    await post.save();
    console.log('[Create Post] Post saved successfully, ID:', post._id);
    await post.populate('author', 'name alias');
    
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error('\n[Create Post] ========== ERROR ==========');
    console.error('[Create Post] Error name:', error.name);
    console.error('[Create Post] Error message:', error.message);
    console.error('[Create Post] Error stack:', error.stack);
    if (error.errors) {
      console.error('[Create Post] Validation errors:', error.errors);
    }
    console.error('[Create Post] ===========================\n');
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: errorMessages || 'Validation error' 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Like a post
router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Simply increment the like count
    post.likeCount += 1;
    await post.save();
    
    res.json({ success: true, likeCount: post.likeCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update like' });
  }
});

// Add a reply to a post
router.post('/posts/:postId/replies', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const reply = {
      content: content.trim(),
      author: req.userId,
      authorName: user.alias || user.name
    };

    post.replies.push(reply);
    await post.save();
    
    res.status(201).json({ success: true, reply: post.replies[post.replies.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add reply' });
  }
});

// Like a reply
router.post('/posts/:postId/replies/:replyId/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const reply = post.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    // Simply increment the like count
    reply.likeCount += 1;
    await post.save();
    
    res.json({ success: true, likeCount: reply.likeCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update reply like' });
  }
});

// Create a topic request (non-admin users)
router.post('/topic-requests', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is admin - admins should use the regular topic creation endpoint
    if (user.admin) {
      return res.status(400).json({ success: false, message: 'Admins should use the topic creation endpoint' });
    }

    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    // Check if topic with this name already exists
    const existingTopic = await Topic.findOne({ name: name.trim() });
    if (existingTopic) {
      return res.status(400).json({ success: false, message: 'Topic with this name already exists' });
    }

    // Check if there's already a pending request with this name
    const existingRequest = await TopicRequest.findOne({ 
      name: name.trim(), 
      status: 'Pending' 
    });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'A pending request with this name already exists' });
    }

    const topicRequest = new TopicRequest({
      name: name.trim(),
      description: description?.trim() || '',
      userId: req.userId
    });

    await topicRequest.save();
    res.status(201).json({ success: true, topicRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create topic request' });
  }
});

// Get topic requests for the current user (non-admin)
router.get('/topic-requests/my-requests', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If admin, return empty array (they should use the admin endpoint)
    if (user.admin) {
      return res.json({ success: true, requests: [] });
    }

    const requests = await TopicRequest.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch topic requests' });
  }
});

// Get pending topic requests (admin only) - includes both Pending and Edit_Requested
router.get('/topic-requests/pending', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await TopicRequest.find({ status: { $in: ['Pending', 'Edit_Requested'] } })
      .populate('userId', 'name alias')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending topic requests' });
  }
});

// Approve a topic request (admin only)
router.post('/topic-requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const topicRequest = await TopicRequest.findById(req.params.id);
    
    if (!topicRequest) {
      return res.status(404).json({ success: false, message: 'Topic request not found' });
    }

    if (topicRequest.status !== 'Pending' && topicRequest.status !== 'Edit_Requested') {
      return res.status(400).json({ success: false, message: 'Topic request cannot be approved in its current status' });
    }

    // Check if topic with this name already exists
    const existingTopic = await Topic.findOne({ name: topicRequest.name });
    if (existingTopic) {
      // Mark as rejected if topic already exists
      topicRequest.status = 'Rejected';
      topicRequest.reviewedBy = req.userId;
      topicRequest.reviewedAt = new Date();
      await topicRequest.save();
      return res.status(400).json({ success: false, message: 'Topic with this name already exists' });
    }

    // Create the topic
    const topic = new Topic({
      name: topicRequest.name,
      description: topicRequest.description,
      createdBy: topicRequest.userId
    });

    await topic.save();

    // Update the request status
    topicRequest.status = 'Approved';
    topicRequest.reviewedBy = req.userId;
    topicRequest.reviewedAt = new Date();
    await topicRequest.save();

    res.json({ success: true, topic, topicRequest });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Topic name already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to approve topic request' });
    }
  }
});

// Reject a topic request (admin only)
router.post('/topic-requests/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const topicRequest = await TopicRequest.findById(req.params.id);
    
    if (!topicRequest) {
      return res.status(404).json({ success: false, message: 'Topic request not found' });
    }

    if (topicRequest.status !== 'Pending' && topicRequest.status !== 'Edit_Requested') {
      return res.status(400).json({ success: false, message: 'Topic request cannot be rejected in its current status' });
    }

    topicRequest.status = 'Rejected';
    topicRequest.rejectionReason = reason?.trim() || '';
    topicRequest.reviewedBy = req.userId;
    topicRequest.reviewedAt = new Date();
    await topicRequest.save();

    res.json({ success: true, topicRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject topic request' });
  }
});

// Request edits for a topic request (admin only)
router.post('/topic-requests/:id/request-edit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { feedbackText } = req.body;
    const topicRequest = await TopicRequest.findById(req.params.id);
    
    if (!topicRequest) {
      return res.status(404).json({ success: false, message: 'Topic request not found' });
    }

    if (topicRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Can only request edits for pending topic requests' });
    }

    if (!feedbackText || !feedbackText.trim()) {
      return res.status(400).json({ success: false, message: 'Feedback text is required' });
    }

    topicRequest.status = 'Edit_Requested';
    topicRequest.feedbackText = feedbackText.trim();
    topicRequest.reviewedBy = req.userId;
    topicRequest.reviewedAt = new Date();
    await topicRequest.save();

    res.json({ success: true, topicRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to request edits' });
  }
});

// Update a topic request (non-admin users can update their own Edit_Requested requests)
router.put('/topic-requests/:id', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const topicRequest = await TopicRequest.findById(req.params.id);
    
    if (!topicRequest) {
      return res.status(404).json({ success: false, message: 'Topic request not found' });
    }

    // Check if user owns this request
    if (topicRequest.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own topic requests' });
    }

    // Only allow editing if status is Edit_Requested
    if (topicRequest.status !== 'Edit_Requested') {
      return res.status(400).json({ success: false, message: 'Topic request can only be edited when edit is requested' });
    }

    // Validate name
    if (name && name.trim()) {
      // Check if another topic or request with this name exists
      const existingTopic = await Topic.findOne({ name: name.trim() });
      if (existingTopic) {
        return res.status(400).json({ success: false, message: 'Topic with this name already exists' });
      }

      const existingRequest = await TopicRequest.findOne({ 
        name: name.trim(), 
        _id: { $ne: req.params.id },
        status: { $in: ['Pending', 'Edit_Requested'] }
      });
      if (existingRequest) {
        return res.status(400).json({ success: false, message: 'Another pending request with this name already exists' });
      }

      topicRequest.name = name.trim();
    }

    if (description !== undefined) {
      topicRequest.description = description?.trim() || '';
    }

    // Reset status to Pending after user makes edits
    topicRequest.status = 'Pending';
    topicRequest.feedbackText = undefined; // Clear feedback after edits
    await topicRequest.save();

    res.json({ success: true, topicRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update topic request' });
  }
});


export default router;
