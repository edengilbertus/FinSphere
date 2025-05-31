// Request validation middleware

const validateRegistration = (req, res, next) => {
  const { authId, idToken, email, firstName, lastName, password } = req.body;
  const errors = [];
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDirectRegistration = isDevelopment && email && password && !idToken && !authId;

  if (isDirectRegistration) {
    // Direct registration validation in development mode
    if (!email || email.trim() === '') {
      errors.push('email is required');
    } else {
      // Email format validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please provide a valid email address');
      }
    }

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
  } else {
    // Firebase auth validation
    if (!idToken) {
      errors.push('idToken is required for Firebase authentication');
    }
  }

  // Common validations for both methods
  if (!firstName || firstName.trim() === '') {
    errors.push('firstName is required');
  }

  if (!lastName || lastName.trim() === '') {
    errors.push('lastName is required');
  }

  // Optional phone number validation
  if (req.body.phoneNumber) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(req.body.phoneNumber)) {
      errors.push('Please provide a valid phone number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { idToken, email, password } = req.body;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDirectLogin = isDevelopment && email && password && !idToken;

  if (isDirectLogin) {
    // Direct login validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
  } else {
    // Firebase auth validation
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required for Firebase authentication'
      });
    }
  }
  
  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const allowedFields = [
    'profile',
    'profile.firstName',
    'profile.lastName',
    'profile.phoneNumber',
    'profile.dateOfBirth',
    'profile.address'
  ];

  const updates = Object.keys(req.body);
  const errors = [];

  // Check for forbidden fields
  const forbiddenFields = ['authId', 'email', '_id', 'createdAt', 'updatedAt'];
  const hasForbiddenField = updates.some(field => forbiddenFields.includes(field));

  if (hasForbiddenField) {
    errors.push('Cannot update protected fields (authId, email, _id, createdAt, updatedAt)');
  }

  // Validate profile fields if present
  if (req.body.profile) {
    const { firstName, lastName, phoneNumber } = req.body.profile;

    if (firstName !== undefined && (!firstName || firstName.trim() === '')) {
      errors.push('firstName cannot be empty');
    }

    if (lastName !== undefined && (!lastName || lastName.trim() === '')) {
      errors.push('lastName cannot be empty');
    }

    if (phoneNumber !== undefined && phoneNumber !== '') {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(phoneNumber)) {
        errors.push('Please provide a valid phone number');
      }
    }

    if (req.body.profile.dateOfBirth) {
      const date = new Date(req.body.profile.dateOfBirth);
      if (isNaN(date.getTime())) {
        errors.push('Please provide a valid date of birth');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate
};
