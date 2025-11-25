import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  alias: {
    type: String,
    trim: true,
    maxlength: [50, 'Alias cannot exceed 50 characters'],
    default: ''
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Must be at least 18 years old'],
    max: [100, 'Age cannot exceed 100']
  },
  caregiverType: {
    type: String,
    required: [true, 'Caregiver type is required'],
    enum: ['parent', 'guardian', 'grandparent'],
    lowercase: true
  },
  familyInfo: {
    numberOfKids: {
      type: Number,
      required: [true, 'Number of kids is required'],
      min: [1, 'Must have at least 1 child'],
      max: [20, 'Cannot exceed 20 children']
    },
    kidsAgeGroups: [{
      type: String,
      enum: ['0-3', '4-6', '7-12', '13-18'],
      required: true
    }],
    additionalInfo: {
      type: String,
      maxlength: [500, 'Additional info cannot exceed 500 characters'],
      trim: true
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  location: {
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    }
  },
  showLocation: {
    type: Boolean,
    default: true
  },
  admin: {
    type: Boolean,
    default: false
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);
