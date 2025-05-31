const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Follow = require('../models/Follow');
const { authenticateToken } = require('../middleware/auth');

// Follow a user
router.post('/follow/:id', authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = req.user;

    if (!userToFollow || userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ success: false, message: 'Invalid follow action' });
    }

    // Check if already following
    const existingFollow = await Follow.isFollowing(currentUser._id, userToFollow._id);
    if (existingFollow) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: currentUser._id,
      following: userToFollow._id
    });
    await follow.save();

    res.json({ success: true, message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Unfollow a user
router.post('/unfollow/:id', authenticateToken, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = req.user;

    if (!userToUnfollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove follow relationship
    await Follow.findOneAndUpdate(
      { follower: currentUser._id, following: userToUnfollow._id },
      { isActive: false },
      { new: true }
    );

    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Friend Recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get users current user is already following
    const following = await Follow.find({ 
      follower: currentUserId, 
      isActive: true 
    }).select('following');
    
    const followingIds = following.map(f => f.following);
    followingIds.push(currentUserId); // Exclude self

    // Basic recommendations: users not currently followed
    let recommendations = await User.find({
      _id: { $nin: followingIds },
      isActive: true
    })
    .select('profile.firstName profile.lastName profile.username profile.profilePictureUrl profile.interests profile.address')
    .limit(10);

    // Try to get interest-based recommendations if available
    if (req.user.profile && req.user.profile.interests && req.user.profile.interests.length > 0) {
      const interestBasedUsers = await User.find({
        _id: { $nin: followingIds },
        isActive: true,
        'profile.interests': { $in: req.user.profile.interests }
      })
      .select('profile.firstName profile.lastName profile.username profile.profilePictureUrl profile.interests profile.address')
      .limit(5);

      // Merge and prioritize interest-based recommendations
      const interestIds = interestBasedUsers.map(u => u._id.toString());
      recommendations = [
        ...interestBasedUsers,
        ...recommendations.filter(u => !interestIds.includes(u._id.toString()))
      ].slice(0, 10);
    }

    res.json({ 
      success: true, 
      data: recommendations,
      message: `Found ${recommendations.length} friend recommendations`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's followers
router.get('/followers', authenticateToken, async (req, res) => {
  try {
    const followers = await Follow.getFollowers(req.user._id);
    res.json({ 
      success: true, 
      data: followers,
      count: followers.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get users that current user is following
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const following = await Follow.getFollowing(req.user._id);
    res.json({ 
      success: true, 
      data: following,
      count: following.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get follow statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Follow.getFollowStats(req.user._id);
    res.json({ 
      success: true, 
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
