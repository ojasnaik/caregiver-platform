import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import discussionRoutes from './routes/discussions.js';
import resourceRoutes from './routes/resources.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed browser origins (e.g. your Vercel URL).
// When unset (local dev) all origins are allowed to keep DX frictionless.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and, when no allowlist is
    // configured, everything. Otherwise restrict to the configured origins.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
}));
app.use(express.json());

// Health check — cheap, does not touch the ML pipeline. Used by platform
// health probes and any keep-warm pinger.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'caregiver-app'
    });
    console.log('MongoDB connected successfully to caregiver-app database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
