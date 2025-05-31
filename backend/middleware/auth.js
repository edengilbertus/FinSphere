const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyIdToken } = require('../utils/firebase');

// Middleware to verify JWT token (custom JWT or Firebase ID token)
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log(`🔐 Authenticating token: ${token.substring(0, 20)}...`);

    let user;
    let authId;

    // Try Firebase ID token first
    try {
      const firebaseResult = await verifyIdToken(token);
      if (firebaseResult.success) {
        authId = firebaseResult.user.authId;
        console.log(`✅ Firebase token verified for authId: ${authId}`);
        
        user = await User.findByAuthId(authId);
        
        if (!user) {
          console.log(`❌ User not found in database for authId: ${authId}`);
          return res.status(401).json({
            success: false,
            message: 'User not found. Please register first.',
            authId: authId
          });
        }
        
        console.log(`✅ User found: ${user.email}`);
      }
    } catch (firebaseError) {
      console.log(`⚠️ Firebase token verification failed: ${firebaseError.message}`);
      
      // If Firebase token verification fails, try custom JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        authId = decoded.authId;
        console.log(`✅ Custom JWT verified for authId: ${authId}`);
        
        user = await User.findByAuthId(authId);
        
        if (!user) {
          console.log(`❌ User not found in database for JWT authId: ${authId}`);
          return res.status(401).json({
            success: false,
            message: 'Invalid token - user not found',
            authId: authId
          });
        }
      } catch (jwtError) {
        console.log(`❌ JWT verification failed: ${jwtError.message}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request object
    req.user = user;
    console.log(`✅ Authentication successful for user: ${user.email}`);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Middleware to optionally authenticate (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByAuthId(decoded.authId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
