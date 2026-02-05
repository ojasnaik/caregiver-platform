import mongoose from 'mongoose';

const topicRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [50, 'Topic name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Edit_Requested'],
    default: 'Pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  feedbackText: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback text cannot exceed 500 characters']
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
topicRequestSchema.index({ userId: 1, createdAt: -1 });
topicRequestSchema.index({ status: 1 });

// Update the updatedAt field before saving
topicRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('TopicRequest', topicRequestSchema);

