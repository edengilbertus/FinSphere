const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// @desc    Follow a user
// @route   POST /api/v1/follow/:userId
// @access  Private
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if user to follow exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow || !userToFollow.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    const existingFollow = await Follow.isFollowing(req.user._id, userId);
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    const follow = new Follow({
      follower: req.user._id,
      following: userId
    });

    await follow.save();

    // Get updated follow stats
    const stats = await Follow.getFollowStats(userId);

    res.status(201).json({
      success: true,
      message: 'User followed successfully',
      data: {
        following: {
          _id: userToFollow._id,
          profile: userToFollow.profile
        },
        stats
      }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
});

// @desc    Unfollow a user
// @route   DELETE /api/v1/follow/:userId
// @access  Private
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and remove the follow relationship
    const result = await Follow.findOneAndUpdate(
      {
        follower: req.user._id,
        following: userId,
        isActive: true
      },
      {
        isActive: false
      },
      {
        new: true
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Follow relationship not found'
      });
    }

    // Get updated follow stats
    const stats = await Follow.getFollowStats(userId);

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: { stats }
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
});

// @desc    Get user's followers and following
// @route   GET /api/v1/follow/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'both'; // 'followers', 'following', 'both'

    let followers = [];
    let following = [];
    let stats = {};

    if (type === 'followers' || type === 'both') {
      followers = await Follow.getFollowers(req.user._id, limit, skip);
    }

    if (type === 'following' || type === 'both') {
      following = await Follow.getFollowing(req.user._id, limit, skip);
    }

    stats = await Follow.getFollowStats(req.user._id);

    res.json({
      success: true,
      data: {
        followers: followers.map(f => ({
          user: f.follower,
          followedAt: f.createdAt
        })),
        following: following.map(f => ({
          user: f.following,
          followedAt: f.createdAt
        })),
        stats
      }
    });

  } catch (error) {
    console.error('Get user follows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow data'
    });
  }
});

// @desc    Get specific user's followers and following (public)
// @route   GET /api/v1/follow/:userId
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'both'; // 'followers', 'following', 'both'

    // Check if user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let followers = [];
    let following = [];
    let stats = {};
    let isFollowing = false;
    let isFollowedBy = false;

    if (type === 'followers' || type === 'both') {
      followers = await Follow.getFollowers(userId, limit, skip);
    }

    if (type === 'following' || type === 'both') {
      following = await Follow.getFollowing(userId, limit, skip);
    }

    stats = await Follow.getFollowStats(userId);

    // Check relationship with current user
    if (userId !== req.user._id.toString()) {
      isFollowing = !!(await Follow.isFollowing(req.user._id, userId));
      isFollowedBy = !!(await Follow.isFollowing(userId, req.user._id));
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          profile: user.profile
        },
        followers: followers.map(f => ({
          user: f.follower,
          followedAt: f.createdAt
        })),
        following: following.map(f => ({
          user: f.following,
          followedAt: f.createdAt
        })),
        stats,
        relationship: {
          isFollowing,
          isFollowedBy,
          isMutual: isFollowing && isFollowedBy
        }
      }
    });

  } catch (error) {
    console.error('Get user follows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow data'
    });
  }
});

// @desc    Get mutual follows (users who follow each other)
// @route   GET /api/v1/follow/mutual
// @access  Private
router.get('/mutual', authenticateToken, async (req, res) => {
  try {
    const mutualFollows = await Follow.getMutualFollows(req.user._id);

    res.json({
      success: true,
      data: {
        mutualFollows,
        count: mutualFollows.length
      }
    });

  } catch (error) {
    console.error('Get mutual follows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching mutual follows'
    });
  }
});

// @desc    Get suggested users to follow
// @route   GET /api/v1/follow/suggestions
// @access  Private
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const suggestions = await Follow.getSuggestedFollows(req.user._id, limit);

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      }
    });

  } catch (error) {
    console.error('Get follow suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow suggestions'
    });
  }
});

// @desc    Check if current user follows specific user
// @route   GET /api/v1/follow/:userId/status
// @access  Private
router.get('/:userId/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.json({
        success: true,
        data: {
          isFollowing: false,
          isFollowedBy: false,
          isMutual: false,
          isSelf: true
        }
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [isFollowing, isFollowedBy] = await Promise.all([
      Follow.isFollowing(req.user._id, userId),
      Follow.isFollowing(userId, req.user._id)
    ]);

    res.json({
      success: true,
      data: {
        isFollowing: !!isFollowing,
        isFollowedBy: !!isFollowedBy,
        isMutual: !!isFollowing && !!isFollowedBy,
        isSelf: false
      }
    });

  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking follow status'
    });
  }
});

// @desc    Remove a follower
// @route   DELETE /api/v1/follow/followers/:userId
// @access  Private
router.delete('/followers/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove the follow relationship where userId follows current user
    const result = await Follow.findOneAndUpdate(
      {
        follower: userId,
        following: req.user._id,
        isActive: true
      },
      {
        isActive: false
      },
      {
        new: true
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Follower relationship not found'
      });
    }

    res.json({
      success: true,
      message: 'Follower removed successfully'
    });

  } catch (error) {
    console.error('Remove follower error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing follower'
    });
  }
});

// @desc    Get friend recommendations based on interests and location
// @route   GET /api/v1/follow/recommendations/interests
// @access  Private
router.get('/recommendations/interests', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const currentUser = await User.findById(req.user._id).select('profile.interests profile.address');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Build match criteria based on user's interests and location
    const matchCriteria = {
      _id: { $ne: req.user._id },
      isActive: true
    };

    // Add interest-based matching
    if (currentUser.profile.interests && currentUser.profile.interests.length > 0) {
      matchCriteria['profile.interests'] = { 
        $in: currentUser.profile.interests 
      };
    }

    // Add location-based matching
    if (currentUser.profile.address && currentUser.profile.address.city) {
      matchCriteria.$or = [
        { 'profile.address.city': currentUser.profile.address.city },
        { 'profile.address.state': currentUser.profile.address.state }
      ];
    }

    // Get users with similar interests/location
    const recommendations = await User.aggregate([
      { $match: matchCriteria },
      // Exclude users already followed
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', req.user._id] },
                    { $eq: ['$following', '$$userId'] },
                    { $eq: ['$isActive', true] }
                  ]
                }
              }
            }
          ],
          as: 'alreadyFollowing'
        }
      },
      { $match: { alreadyFollowing: { $eq: [] } } },
      // Calculate similarity score
      {
        $addFields: {
          interestMatches: {
            $size: {
              $setIntersection: [
                '$profile.interests',
                currentUser.profile.interests || []
              ]
            }
          },
          locationMatch: {
            $cond: [
              {
                $or: [
                  { $eq: ['$profile.address.city', currentUser.profile.address?.city] },
                  { $eq: ['$profile.address.state', currentUser.profile.address?.state] }
                ]
              },
              1,
              0
            ]
          }
        }
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ['$interestMatches', 2] }, // Weight interests more
              '$locationMatch'
            ]
          }
        }
      },
      { $match: { similarityScore: { $gt: 0 } } },
      { $sort: { similarityScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          profile: 1,
          similarityScore: 1,
          interestMatches: 1,
          locationMatch: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        criteria: {
          interests: currentUser.profile.interests || [],
          location: currentUser.profile.address || null
        }
      }
    });

  } catch (error) {
    console.error('Get interest-based recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recommendations'
    });
  }
});

// @desc    Get recently joined users for recommendations
// @route   GET /api/v1/follow/recommendations/recent
// @access  Private
router.get('/recommendations/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const daysBack = parseInt(req.query.days) || 7; // Default to last 7 days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: req.user._id },
          isActive: true,
          createdAt: { $gte: cutoffDate }
        }
      },
      // Exclude users already followed
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', req.user._id] },
                    { $eq: ['$following', '$$userId'] },
                    { $eq: ['$isActive', true] }
                  ]
                }
              }
            }
          ],
          as: 'alreadyFollowing'
        }
      },
      { $match: { alreadyFollowing: { $eq: [] } } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          profile: 1,
          createdAt: 1,
          joinedDaysAgo: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        recentUsers,
        count: recentUsers.length,
        criteria: {
          daysBack,
          cutoffDate
        }
      }
    });

  } catch (error) {
    console.error('Get recent users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent users'
    });
  }
});

// @desc    Get comprehensive friend recommendations
// @route   GET /api/v1/follow/recommendations/all
// @access  Private
router.get('/recommendations/all', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    
    // Get different types of recommendations
    const [networkSuggestions, interestRecommendations, recentUsers] = await Promise.all([
      Follow.getSuggestedFollows(req.user._id, Math.ceil(limit * 0.5)),
      // Get interest-based recommendations (simplified query)
      User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        'profile.interests': { $exists: true, $ne: [] }
      })
      .limit(Math.ceil(limit * 0.3))
      .select('profile'),
      // Get recent users
      User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .limit(Math.ceil(limit * 0.2))
      .select('profile createdAt')
    ]);

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...networkSuggestions.map(s => ({ ...s, type: 'network' })),
      ...interestRecommendations.map(u => ({ user: u, type: 'interests' })),
      ...recentUsers.map(u => ({ user: u, type: 'recent' }))
    ];

    // Remove duplicates by user ID
    const uniqueRecommendations = allRecommendations.reduce((acc, rec) => {
      const userId = rec.user._id.toString();
      if (!acc.find(r => r.user._id.toString() === userId)) {
        acc.push(rec);
      }
      return acc;
    }, []);

    // Limit final results
    const finalRecommendations = uniqueRecommendations.slice(0, limit);

    res.json({
      success: true,
      data: {
        recommendations: finalRecommendations,
        count: finalRecommendations.length,
        breakdown: {
          network: networkSuggestions.length,
          interests: interestRecommendations.length,
          recent: recentUsers.length,
          total: uniqueRecommendations.length
        }
      }
    });

  } catch (error) {
    console.error('Get all recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recommendations'
    });
  }
});

module.exports = router;
