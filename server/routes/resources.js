import express from 'express';
import Resource from '../models/Resource.js';
import User from '../models/User.js';

const router = express.Router();

// Simple auth using user-id header (consistent with discussions routes)
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

// GET /api/resources - list active resources (newest first)
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
});

// POST /api/resources - create new resource (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, url, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, message: 'Valid URL (http/https) is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    // Basic 100-word limit enforcement
    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 100) {
      return res.status(400).json({ success: false, message: 'Description must be 100 words or fewer' });
    }

    const resource = new Resource({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      createdBy: req.userId
    });

    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create resource' });
  }
});

export default router;


