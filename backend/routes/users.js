const express = require('express');
const {
  getProfile,
  updateProfile,
  deactivateAccount,
  getUserById,
  getFriendRecommendations // Added
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const RecommendationService = require('../services/recommendations'); // Added

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// User profile routes
router.route('/me')
  .get(getProfile)
  .put(updateProfile)
  .delete(deactivateAccount);

// Friend recommendations for the current user
router.get('/me/recommendations', async (req, res) => {
  try {
    const recommendations = await RecommendationService.recommendFriends(req.user.id, parseInt(req.query.limit) || 10);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch friend recommendations', error: error.message });
  }
});

// Get user by ID (for public profiles)
router.get('/:id', getUserById);

module.exports = router;
