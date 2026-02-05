import mongoose from 'mongoose';
import { generateEmbeddingFromFields } from '../utils/embeddings.js';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    match: [/^https?:\/\//i, 'URL must start with http or https']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1200, 'Description cannot exceed 1200 characters'] // ~100 words safeguard
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  embedding: {
    type: [Number],
    default: undefined
  }
}, { timestamps: true });

// Pre-save hook to generate embedding before saving
resourceSchema.pre('save', async function(next) {
  // Only generate embedding if it doesn't exist or if title/description changed
  if (!this.embedding || this.isModified('title') || this.isModified('description')) {
    try {
      // Generate embedding from title and description fields
      this.embedding = await generateEmbeddingFromFields(this, ['title', 'description']);
    } catch (error) {
      console.error('Error generating embedding for resource:', error);
      // Continue saving even if embedding generation fails
      // You can choose to throw the error if you want to prevent saving
    }
  }
  next();
});

export default mongoose.model('Resource', resourceSchema);


