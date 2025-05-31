require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

// Import Firebase initialization
const { initializeFirebase } = require('./utils/firebase');
const socketService = require('./utils/socket');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const feedRoutes = require('./routes/feed');
const messageRoutes = require('./routes/messages');
const loanRoutes = require('./routes/loans');
const followRoutes = require('./routes/follow');
const uploadRoutes = require('./routes/upload');
const savingsGoalsRoutes = require('./routes/savingsGoals');
const friendsRoutes = require('./routes/friends');
// const savingsRoutes = require('./routes/savings');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin SDK
initializeFirebase();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/follow', followRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/savings', savingsGoalsRoutes);
app.use('/api/v1/friends', friendsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FinSphere Backend API', 
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      feed: '/api/v1/feed',
      messages: '/api/v1/messages',
      loans: '/api/v1/loans',
      follow: '/api/v1/follow',
      upload: '/api/v1/upload',
      savings: '/api/v1/savings',
      savings: '/api/v1/savings',
      friends: '/api/v1/friends',
      health: '/health'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      // Set connection timeout to prevent hanging
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000, // 5 seconds
        connectTimeoutMS: 10000, // 10 seconds
      };
      
      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️  MONGODB_URI not found in environment variables');
      console.log('📝 Please set up your .env file with database configuration');
      console.log('ℹ️  Server will continue without database connection');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Continuing without database connection for development');
    // Don't exit in development mode - allow server to continue
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('💾 MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  // Initialize Socket.IO after server is created
  socketService.initialize(server);
  
  server.listen(PORT, () => {
    console.log(`🚀 FinSphere Backend + Socket.IO running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/v1/auth`);
    console.log(`👤 User Endpoints: http://localhost:${PORT}/api/v1/users`);
    console.log(`💬 Real-time Messaging: Socket.IO enabled`);
  });
};

startServer();
