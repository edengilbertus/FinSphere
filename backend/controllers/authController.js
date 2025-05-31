const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokenPair } = require('../utils/jwt');
const { verifyIdToken } = require('../utils/firebase');

// @desc    Register a new user (via Identity Platform or direct in dev)
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { 
      idToken, // Firebase ID token from client
      firstName, 
      lastName, 
      phoneNumber,
      email,
      password
    } = req.body;

    // Development direct registration if email/password provided without token
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDirectRegistration = isDevelopment && email && password && !idToken;

    // Validation - different requirements for Firebase auth vs direct registration
    if (!isDirectRegistration && (!idToken || !firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide idToken, firstName, and lastName'
      });
    }
    
    if (isDirectRegistration && (!email || !password || !firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, firstName, and lastName'
      });
    }

    // Handle authentication based on method (Firebase or direct)
    let authId, userEmail, emailVerified;
    
    if (isDirectRegistration) {
      // Direct registration in development mode
      userEmail = email.toLowerCase();
      authId = `direct-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      emailVerified = true;
    } else {
      // Firebase authentication
      const firebaseResult = await verifyIdToken(idToken);
      if (!firebaseResult.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid ID token',
          error: firebaseResult.error
        });
      }
      
      authId = firebaseResult.user.authId;
      userEmail = firebaseResult.user.email.toLowerCase();
      emailVerified = firebaseResult.user.emailVerified;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { authId },
        { email: userEmail }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or authId'
      });
    }

    // Create user object
    const userData = {
      authId,
      email: userEmail,
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber?.trim()
      }
    };
    
    // If direct registration, hash and store password
    if (isDirectRegistration && password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      userData.password = hashedPassword;
    }
    
    // Create user in our database
    const user = await User.create(userData);

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          authId: user.authId,
          email: user.email,
          profile: user.profile,
          createdAt: user.createdAt
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// @desc    Login user / Verify Identity Platform token or direct login
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { idToken, email, password } = req.body;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDirectLogin = isDevelopment && email && password && !idToken;
    
    let user;
    
    if (isDirectLogin) {
      // Direct email/password login for development
      user = await User.findOne({ email: email.toLowerCase() });
      
      // Check if user exists
      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } else {
      // Firebase auth login
      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'ID token is required for Firebase authentication'
        });
      }

      // Verify Firebase ID token
      const firebaseResult = await verifyIdToken(idToken);
      if (!firebaseResult.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid ID token',
          error: firebaseResult.error
        });
      }

      const { authId } = firebaseResult.user;

      // Find user in our database
      user = await User.findByAuthId(authId);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
        authId: authId,
        email: email
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          authId: user.authId,
          email: user.email,
          profile: user.profile,
          lastLoginAt: user.lastLoginAt
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          authId: user.authId,
          email: user.email,
          profile: user.profile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
