const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [1000, 'Message content cannot exceed 1000 characters']
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachmentUrl: {
    type: String,
    trim: true
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

// Compound indexes for better query performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ],
    isActive: true
  })
    .populate('sender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .populate('recipient', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user's conversations (latest message from each contact)
messageSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { recipient: userId }],
        isActive: true
      }
    },
    {
      $addFields: {
        otherUser: {
          $cond: {
            if: { $eq: ['$sender', userId] },
            then: '$recipient',
            else: '$sender'
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: {
              if: {
                $and: [
                  { $eq: ['$recipient', userId] },
                  { $eq: ['$read', false] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUserInfo'
      }
    },
    {
      $unwind: '$otherUserInfo'
    },
    {
      $project: {
        _id: 0,
        otherUser: {
          _id: '$otherUserInfo._id',
          profile: '$otherUserInfo.profile'
        },
        lastMessage: '$lastMessage',
        unreadCount: '$unreadCount'
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Instance method to mark message as read
messageSchema.methods.markAsRead = function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markConversationAsRead = function(senderId, recipientId) {
  return this.updateMany(
    {
      sender: senderId,
      recipient: recipientId,
      read: false,
      isActive: true
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
