import mongoose from 'mongoose';
import { generateEmbeddingFromFields } from '../utils/embeddings.js';

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Count words more accurately (split by whitespace and filter empty strings)
        const wordCount = v.trim().split(/\s+/).filter(word => word.length > 0).length;
        return wordCount <= 100;
      },
      message: 'Post cannot exceed 100 words. Please shorten your post.'
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  topicName: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likeCount: {
    type: Number,
    default: 0
  },
  embedding: {
    type: [Number],
    default: undefined
  },
  replies: [{
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likeCount: {
      type: Number,
      default: 0
    }
  }]
});

// Pre-save hook to generate embedding before saving
postSchema.pre('save', async function(next) {
  // Only generate embedding if it doesn't exist or if content/topicName changed
  if (!this.embedding || this.isModified('content') || this.isModified('topicName')) {
    try {
      console.log('[Post Embedding] Generating embedding for post...');
      console.log('[Post Embedding] Content length:', this.content?.length || 0);
      console.log('[Post Embedding] Topic name:', this.topicName);
      
      // Add timeout to embedding generation (30 seconds)
      const embeddingPromise = generateEmbeddingFromFields(this, ['content', 'topicName']);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Embedding generation timeout after 30 seconds')), 30000)
      );
      
      this.embedding = await Promise.race([embeddingPromise, timeoutPromise]);
      console.log('[Post Embedding] Embedding generated successfully, dimensions:', this.embedding?.length || 0);
    } catch (error) {
      console.error('[Post Embedding] Error generating embedding for post:', error);
      console.error('[Post Embedding] Error message:', error.message);
      console.error('[Post Embedding] Error stack:', error.stack);
      // Set embedding to undefined to allow save to continue without embedding
      this.embedding = undefined;
      // Continue saving even if embedding generation fails
      // This allows posts to be saved even if embedding service is unavailable
      console.log('[Post Embedding] Continuing save without embedding...');
    }
  }
  next();
});

// Index for better query performance
postSchema.index({ topicName: 1, createdAt: -1 });
postSchema.index({ author: 1 });

export default mongoose.model('Post', postSchema);
