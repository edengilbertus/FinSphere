const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
const getProfile = async (req, res) => {
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

// @desc    Update user profile
// @route   PUT /api/v1/users/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      'profile.firstName',
      'profile.lastName',
      'profile.username',
      'profile.bio',
      'profile.phoneNumber',
      'profile.dateOfBirth',
      'profile.address',
      'profile.interests',
      'profile.profilePictureUrl'
    ];

    // Build update object
    const updateObj = {};
    
    // Handle nested profile updates
    if (updates.profile) {
      Object.keys(updates.profile).forEach(key => {
        if (allowedUpdates.includes(`profile.${key}`)) {
          updateObj[`profile.${key}`] = updates.profile[key];
        }
      });
    }

    // Handle direct field updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateObj[field] = updates[field];
      }
    });

    // Prevent updating sensitive fields
    delete updateObj.authId;
    delete updateObj.email;
    delete updateObj._id;
    delete updateObj.createdAt;
    delete updateObj.updatedAt;

    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateObj,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          authId: user.authId,
          email: user.email,
          profile: user.profile,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user profile'
    });
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/v1/users/me
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating account'
    });
  }
};

// @desc    Get user by ID (admin or public profile)
// @route   GET /api/v1/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-authId');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          profile: user.profile,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deactivateAccount,
  getUserById
};
