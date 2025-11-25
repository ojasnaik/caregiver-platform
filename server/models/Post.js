import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [100, 'Post cannot exceed 100 words'],
    validate: {
      validator: function(v) {
        return v.split(' ').length <= 100;
      },
      message: 'Post cannot exceed 100 words'
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

// Index for better query performance
postSchema.index({ topicName: 1, createdAt: -1 });
postSchema.index({ author: 1 });

export default mongoose.model('Post', postSchema);
