import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.enabled = process.env.REACT_APP_ENABLE_SOCKET !== 'false';
  }

  connect(token, serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000') {
    // Check if sockets are enabled in environment
    if (!this.enabled) {
      console.log('Socket functionality disabled via environment setting');
      return null;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    try {
      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: parseInt(process.env.REACT_APP_SOCKET_TIMEOUT) || 20000,
        reconnection: true,
        reconnectionAttempts: parseInt(process.env.REACT_APP_SOCKET_RECONNECTION_ATTEMPTS) || 5,
        reconnectionDelay: parseInt(process.env.REACT_APP_SOCKET_RECONNECTION_DELAY) || 1000,
      });

      this.setupDefaultListeners();
      return this.socket;
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      this.isConnected = false;
      return null;
    }
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to FinSphere chat server');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Authentication successful:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('authentication_error', (data) => {
      console.error('🚫 Authentication failed:', data);
      this.emit('authentication_error', data);
    });

    this.socket.on('new_message', (data) => {
      console.log('💬 New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
      this.emit('message_sent', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('⌨️ User stopped typing:', data);
      this.emit('user_stopped_typing', data);
    });

    this.socket.on('user_status_change', (data) => {
      console.log('👥 User status change:', data);
      this.emit('user_status_change', data);
    });

    this.socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emit('socket_error', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.emit('connection_error', error);
    });
  }

  // Authentication
  authenticate(token) {
    if (!this.enabled) return false;
    if (!this.socket) {
      console.error('Socket not connected');
      return false;
    }
    this.socket.emit('authenticate', { token });
    return true;
  }

  // Message operations
  sendMessage(recipientId, content, messageType = 'text', attachmentUrl = null) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const messageData = {
      recipientId,
      content,
      messageType,
      attachmentUrl
    };

    this.socket.emit('send_message', messageData);
    return true;
  }

  markMessageAsRead(messageId, conversationUserId = null) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('mark_read', {
      messageId,
      conversationUserId
    });
    return true;
  }

  // Typing indicators
  startTyping(recipientId) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('typing_start', { recipientId });
    return true;
  }

  stopTyping(recipientId) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('typing_stop', { recipientId });
    return true;
  }

  // Conversation management
  joinConversation(conversationId) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('join_conversation', { conversationId });
    return true;
  }

  leaveConversation(conversationId) {
    if (!this.enabled) return false;
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('leave_conversation', { conversationId });
    return true;
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection management
  disconnect() {
    if (!this.socket) return;
    
    try {
      this.socket.disconnect();
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    } finally {
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  reconnect() {
    if (!this.enabled) return false;
    if (this.socket) {
      try {
        this.socket.connect();
        return true;
      } catch (error) {
        console.error('Error reconnecting socket:', error);
        return false;
      }
    }
    return false;
  }

  isSocketConnected() {
    if (!this.enabled) return false;
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    if (!this.enabled) return null;
    return this.socket?.id || null;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
