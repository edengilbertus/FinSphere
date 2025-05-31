const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  following: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Additional indexes for performance
followSchema.index({ follower: 1, isActive: 1 });
followSchema.index({ following: 1, isActive: 1 });

// Static method to check if user A follows user B
followSchema.statics.isFollowing = function(followerId, followingId) {
  return this.findOne({
    follower: followerId,
    following: followingId,
    isActive: true
  });
};

// Static method to get followers of a user
followSchema.statics.getFollowers = function(userId, limit = 50, skip = 0) {
  return this.find({ following: userId, isActive: true })
    .populate('follower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get users that a user is following
followSchema.statics.getFollowing = function(userId, limit = 50, skip = 0) {
  return this.find({ follower: userId, isActive: true })
    .populate('following', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get follow stats for a user
followSchema.statics.getFollowStats = async function(userId) {
  const [followersCount, followingCount] = await Promise.all([
    this.countDocuments({ following: userId, isActive: true }),
    this.countDocuments({ follower: userId, isActive: true })
  ]);
  
  return {
    followersCount,
    followingCount
  };
};

// Static method to get mutual follows (users who follow each other)
followSchema.statics.getMutualFollows = function(userId) {
  return this.aggregate([
    {
      $match: {
        follower: userId,
        isActive: true
      }
    },
    {
      $lookup: {
        from: 'follows',
        let: { followingId: '$following' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', '$$followingId'] },
                  { $eq: ['$following', userId] },
                  { $eq: ['$isActive', true] }
                ]
              }
            }
          }
        ],
        as: 'mutualFollow'
      }
    },
    {
      $match: {
        mutualFollow: { $ne: [] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'following',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        _id: 0,
        user: {
          _id: '$userInfo._id',
          profile: '$userInfo.profile'
        },
        followedAt: '$createdAt'
      }
    },
    {
      $sort: { followedAt: -1 }
    }
  ]);
};

// Static method to get suggested users to follow
followSchema.statics.getSuggestedFollows = async function(userId, limit = 10) {
  // Get users that the current user's followers also follow (but current user doesn't)
  const suggestions = await this.aggregate([
    // Get current user's followers
    {
      $match: {
        following: userId,
        isActive: true
      }
    },
    // Get who these followers are following
    {
      $lookup: {
        from: 'follows',
        localField: 'follower',
        foreignField: 'follower',
        as: 'followerFollows'
      }
    },
    {
      $unwind: '$followerFollows'
    },
    // Exclude current user and users already followed
    {
      $match: {
        'followerFollows.following': { $ne: userId },
        'followerFollows.isActive': true
      }
    },
    // Group by suggested user and count connections
    {
      $group: {
        _id: '$followerFollows.following',
        connectionCount: { $sum: 1 },
        connections: { $push: '$follower' }
      }
    },
    // Exclude users already followed by current user
    {
      $lookup: {
        from: 'follows',
        let: { suggestedUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', userId] },
                  { $eq: ['$following', '$$suggestedUserId'] },
                  { $eq: ['$isActive', true] }
                ]
              }
            }
          }
        ],
        as: 'alreadyFollowing'
      }
    },
    {
      $match: {
        alreadyFollowing: { $eq: [] }
      }
    },
    // Get user info
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    // Project final result
    {
      $project: {
        _id: 0,
        user: {
          _id: '$userInfo._id',
          profile: '$userInfo.profile'
        },
        connectionCount: 1,
        mutualConnections: { $size: '$connections' }
      }
    },
    {
      $sort: { connectionCount: -1, mutualConnections: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return suggestions;
};

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
