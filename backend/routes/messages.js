const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const socketService = require('../utils/socket');

// @desc    Send a message
// @route   POST /api/v1/messages
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipient, content, messageType = 'text', attachmentUrl } = req.body;

    // Validation
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is required'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (recipient === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself'
      });
    }

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser || !recipientUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      content: content.trim(),
      messageType,
      attachmentUrl: attachmentUrl?.trim()
    });

    await message.save();
    
    // Populate sender and recipient details
    await message.populate('sender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');
    await message.populate('recipient', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    // Send real-time notification to recipient if online
    if (socketService.isUserOnline(recipient)) {
      socketService.sendNotificationToUser(recipient, {
        type: 'new_message',
        message: message,
        sender: {
          _id: req.user._id,
          profile: {
            firstName: req.user.profile.firstName,
            lastName: req.user.profile.lastName,
            username: req.user.profile.username,
            profilePictureUrl: req.user.profile.profilePictureUrl
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @desc    Get conversation with a specific user
// @route   GET /api/v1/messages/:userId
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser || !otherUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const messages = await Message.getConversation(req.user._id, userId, limit, skip);
    
    // Count total messages in conversation
    const total = await Message.countDocuments({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ],
      isActive: true
    });

    // Mark messages from the other user as read
    await Message.markConversationAsRead(userId, req.user._id);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to get chronological order
        otherUser: {
          _id: otherUser._id,
          profile: otherUser.profile
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversation'
    });
  }
});

// @desc    Get all user's conversations
// @route   GET /api/v1/messages
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
});

// @desc    Mark message as read
// @route   PUT /api/v1/messages/:id/read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || !message.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking message as read'
    });
  }
});

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/v1/messages/:userId/read-all
// @access  Private
router.put('/:userId/read-all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser || !otherUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await Message.markConversationAsRead(userId, req.user._id);

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`
    });

  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking conversation as read'
    });
  }
});

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || !message.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    message.isActive = false;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

// @desc    Search messages
// @route   GET /api/v1/messages/search
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let searchQuery = {
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ],
      content: { $regex: q.trim(), $options: 'i' },
      isActive: true
    };

    // If searching within a specific conversation
    if (userId) {
      searchQuery.$or = [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ];
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
      .populate('recipient', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Message.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        messages,
        searchQuery: q,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching messages'
    });
  }
});

// @desc    Get online users
// @route   GET /api/v1/messages/online-users
// @access  Private
router.get('/online-users', authenticateToken, async (req, res) => {
  try {
    const onlineUserIds = socketService.getOnlineUsers();
    
    // Get user details for online users
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds },
      isActive: true
    }).select('profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    res.json({
      success: true,
      data: {
        onlineUsers,
        count: onlineUsers.length
      }
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching online users'
    });
  }
});

// @desc    Check if user is online
// @route   GET /api/v1/messages/user-status/:userId
// @access  Private
router.get('/user-status/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const isOnline = socketService.isUserOnline(userId);

    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        status: isOnline ? 'online' : 'offline'
      }
    });

  } catch (error) {
    console.error('Check user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking user status'
    });
  }
});

// @desc    Get conversation statistics
// @route   GET /api/v1/messages/stats
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total conversations
    const totalConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$recipient',
              else: '$sender'
            }
          }
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get unread messages count
    const unreadCount = await Message.countDocuments({
      recipient: userId,
      read: false
    });

    // Get total messages sent
    const sentCount = await Message.countDocuments({
      sender: userId
    });

    // Get total messages received
    const receivedCount = await Message.countDocuments({
      recipient: userId
    });

    res.json({
      success: true,
      data: {
        totalConversations: totalConversations[0]?.total || 0,
        unreadMessages: unreadCount,
        messagesSent: sentCount,
        messagesReceived: receivedCount,
        totalMessages: sentCount + receivedCount
      }
    });

  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message statistics'
    });
  }
});

module.exports = router;
