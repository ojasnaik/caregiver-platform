import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// Validation rules for signup
const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('alias')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Alias must be between 2 and 50 characters'),
  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('caregiverType')
    .isIn(['parent', 'guardian', 'grandparent'])
    .withMessage('Caregiver type must be parent, guardian, or grandparent'),
  body('familyInfo.numberOfKids')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of kids must be between 1 and 20'),
  body('familyInfo.kidsAgeGroups')
    .isArray({ min: 1 })
    .withMessage('At least one child age group is required'),
  body('familyInfo.kidsAgeGroups.*')
    .isIn(['0-3', '4-6', '7-12', '13-18'])
    .withMessage('Each child age group must be one of: 0-3, 4-6, 7-12, 13-18'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('familyInfo.additionalInfo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Additional info cannot exceed 500 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('Privacy setting must be a boolean value'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),
  body('location.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State name cannot exceed 50 characters'),
  body('showLocation')
    .optional()
    .isBoolean()
    .withMessage('Location visibility setting must be a boolean value')
];

// Signup route
router.post('/signup', signupValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      alias,
      age,
      caregiverType,
      familyInfo,
      email,
      password,
      isPrivate,
      location,
      showLocation
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate age groups array length matches number of kids
    if (familyInfo.kidsAgeGroups.length !== familyInfo.numberOfKids) {
      return res.status(400).json({
        success: false,
        message: 'Number of age groups must equal number of kids'
      });
    }

    // Create new user
    const user = new User({
      name,
      alias,
      age,
      caregiverType,
      familyInfo,
      email,
      password,
      isPrivate: isPrivate || false,
      location: location || {},
      showLocation: showLocation !== undefined ? showLocation : true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        alias: user.alias,
        email: user.email,
        caregiverType: user.caregiverType,
        familyInfo: user.familyInfo,
        isPrivate: user.isPrivate,
        location: user.location,
        showLocation: user.showLocation,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// Login route (for future implementation)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        caregiverType: user.caregiverType,
        familyInfo: user.familyInfo,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// List users (excluding current and private profiles)
router.get('/users', async (req, res) => {
  try {
    const { currentUserId } = req.query;

    const filter = { isPrivate: { $ne: true } };
    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    const users = await User.find(filter)
      .select('name alias caregiverType familyInfo location showLocation createdAt');

    res.json({ success: true, users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// Get single user by id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
});
 
// Update user profile
router.put('/users/:id',
  [
    body('name')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('alias')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Alias must be between 2 and 50 characters'),
    body('age')
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage('Age must be between 18 and 100'),
    body('caregiverType')
      .optional()
      .isIn(['parent', 'guardian', 'grandparent'])
      .withMessage('Caregiver type must be parent, guardian, or grandparent'),
    body('familyInfo.numberOfKids')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Number of kids must be between 1 and 20'),
    body('familyInfo.kidsAgeGroups')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one child age group is required'),
    body('familyInfo.kidsAgeGroups.*')
      .optional()
      .isIn(['0-3', '4-6', '7-12', '13-18'])
      .withMessage('Each child age group must be one of: 0-3, 4-6, 7-12, 13-18'),
    body('familyInfo.additionalInfo')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Additional info cannot exceed 500 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('Privacy setting must be a boolean value'),
    body('location.city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City name cannot exceed 50 characters'),
    body('location.state')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('State name cannot exceed 50 characters'),
    body('showLocation')
      .optional()
      .isBoolean()
      .withMessage('Location visibility setting must be a boolean value')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const userId = req.params.id;

      // Only allow specific fields to be updated
      const allowedFields = ['name', 'alias', 'age', 'caregiverType', 'familyInfo', 'profilePicture', 'isPrivate', 'location', 'showLocation'];
      const update = {};
      for (const key of allowedFields) {
        if (key in req.body) {
          update[key] = req.body[key];
        }
      }

      // Optional: validate kidsAgeGroups length matches numberOfKids when both provided
      if (update.familyInfo && Array.isArray(update.familyInfo.kidsAgeGroups) && typeof update.familyInfo.numberOfKids === 'number') {
        if (update.familyInfo.kidsAgeGroups.length !== update.familyInfo.numberOfKids) {
          return res.status(400).json({ success: false, message: 'Number of age groups must equal number of kids' });
        }
      }

      const updated = await User.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user: updated });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Server error updating user' });
    }
  }
);

export default router;