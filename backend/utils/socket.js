const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { verifyIdToken } = require('./firebase');
const User = require('../models/User');
const Message = require('../models/Message');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map userId to socketId
    this.userSockets = new Map();    // Map socketId to userId and user data
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('🔌 Socket.IO initialized for real-time messaging');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 New socket connection: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          let user = null;

          // Try Firebase token first
          if (token) {
            try {
              const decodedToken = await verifyIdToken(token);
              user = await User.findByAuthId(decodedToken.uid);
            } catch (firebaseError) {
              // Try JWT token as fallback
              try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);
              } catch (jwtError) {
                console.log('Token verification failed:', jwtError.message);
              }
            }
          }

          if (user) {
            // Store user connection
            this.connectedUsers.set(user._id.toString(), socket.id);
            this.userSockets.set(socket.id, {
              userId: user._id.toString(),
              user: {
                _id: user._id,
                profile: {
                  firstName: user.profile.firstName,
                  lastName: user.profile.lastName,
                  username: user.profile.username,
                  profilePictureUrl: user.profile.profilePictureUrl
                }
              }
            });

            socket.userId = user._id.toString();
            socket.join(`user_${user._id}`);

            // Emit successful authentication
            socket.emit('authenticated', {
              success: true,
              userId: user._id,
              message: 'Successfully authenticated'
            });

            // Notify user is online
            this.broadcastUserStatus(user._id.toString(), 'online');

            console.log(`✅ User authenticated: ${user.profile.firstName} ${user.profile.lastName} (${socket.id})`);
          } else {
            socket.emit('authentication_error', {
              success: false,
              message: 'Invalid token or user not found'
            });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', {
            success: false,
            message: 'Authentication failed'
          });
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const socketData = this.userSockets.get(socket.id);
          if (!socketData) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { recipientId, content, messageType = 'text', attachmentUrl } = data;

          // Validate input
          if (!recipientId || !content?.trim()) {
            socket.emit('error', { message: 'Recipient and content are required' });
            return;
          }

          // Check if recipient exists
          const recipient = await User.findById(recipientId);
          if (!recipient) {
            socket.emit('error', { message: 'Recipient not found' });
            return;
          }

          // Create message in database
          const message = new Message({
            sender: socketData.userId,
            recipient: recipientId,
            content: content.trim(),
            messageType,
            attachmentUrl: attachmentUrl?.trim()
          });

          await message.save();

          // Populate sender details
          await message.populate('sender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');
          await message.populate('recipient', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

          // Send to recipient if online
          const recipientSocketId = this.connectedUsers.get(recipientId);
          if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('new_message', {
              success: true,
              message: message
            });
          }

          // Confirm to sender
          socket.emit('message_sent', {
            success: true,
            message: message
          });

          console.log(`💬 Message sent from ${socketData.user.profile.firstName} to ${recipient.profile.firstName}`);

        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { 
            message: 'Failed to send message',
            error: error.message 
          });
        }
      });

      // Handle marking messages as read
      socket.on('mark_read', async (data) => {
        try {
          const socketData = this.userSockets.get(socket.id);
          if (!socketData) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { messageId, conversationUserId } = data;

          if (messageId) {
            // Mark single message as read
            await Message.findByIdAndUpdate(messageId, {
              read: true,
              readAt: new Date()
            });
          } else if (conversationUserId) {
            // Mark all messages in conversation as read
            await Message.updateMany(
              {
                sender: conversationUserId,
                recipient: socketData.userId,
                read: false
              },
              {
                read: true,
                readAt: new Date()
              }
            );
          }

          socket.emit('messages_marked_read', {
            success: true,
            messageId,
            conversationUserId
          });

        } catch (error) {
          console.error('Mark read error:', error);
          socket.emit('error', { 
            message: 'Failed to mark messages as read',
            error: error.message 
          });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const socketData = this.userSockets.get(socket.id);
        if (!socketData) return;

        const { recipientId } = data;
        const recipientSocketId = this.connectedUsers.get(recipientId);
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user_typing', {
            userId: socketData.userId,
            user: socketData.user
          });
        }
      });

      socket.on('typing_stop', (data) => {
        const socketData = this.userSockets.get(socket.id);
        if (!socketData) return;

        const { recipientId } = data;
        const recipientSocketId = this.connectedUsers.get(recipientId);
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user_stopped_typing', {
            userId: socketData.userId
          });
        }
      });

      // Handle joining conversation rooms
      socket.on('join_conversation', (data) => {
        const { conversationId } = data;
        socket.join(`conversation_${conversationId}`);
      });

      socket.on('leave_conversation', (data) => {
        const { conversationId } = data;
        socket.leave(`conversation_${conversationId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const socketData = this.userSockets.get(socket.id);
        
        if (socketData) {
          // Remove from connected users
          this.connectedUsers.delete(socketData.userId);
          this.userSockets.delete(socket.id);

          // Notify user is offline
          this.broadcastUserStatus(socketData.userId, 'offline');

          console.log(`👋 User disconnected: ${socketData.user.profile.firstName} (${socket.id})`);
        } else {
          console.log(`👋 Anonymous user disconnected: ${socket.id}`);
        }
      });
    });
  }

  // Broadcast user online/offline status
  broadcastUserStatus(userId, status) {
    this.io.emit('user_status_change', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
