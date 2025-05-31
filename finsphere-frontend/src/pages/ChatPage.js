import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  InputAdornment,
  Fab,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Slide,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  ArrowBack,
  AttachFile,
  Mic,
  EmojiEmotions,
  VideoCall,
  Call,
  PersonAdd,
  Circle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socketService';
import apiService from '../services/api';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [navigationPath, setNavigationPath] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations from backend
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getConversations();
        
        if (response.success) {
          // Transform backend conversations to frontend format
          const transformedConversations = response.data.conversations.map(conv => ({
            id: conv._id,
            participant: {
              id: conv.otherUser._id,
              name: `${conv.otherUser.profile.firstName} ${conv.otherUser.profile.lastName}`,
              avatar: conv.otherUser.profile.profilePictureUrl,
              lastSeen: new Date(conv.otherUser.lastLoginAt || Date.now()),
              isOnline: false, // Will be updated by socket events
            },
            lastMessage: {
              text: conv.lastMessage.content,
              timestamp: new Date(conv.lastMessage.createdAt),
              senderId: conv.lastMessage.sender,
            },
            unreadCount: conv.unreadCount || 0,
          }));
          
          setConversations(transformedConversations);
          
          // If chatId is provided, find and set selected chat
          if (chatId) {
            const chat = transformedConversations.find(c => c.id === chatId || c.participant.id === chatId);
            if (chat) {
              setSelectedChat(chat);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setError('Failed to load conversations. Please try again.');
        
        // Fallback to mock data in case of error
        const mockConversations = [
          {
            id: '1',
            participant: {
              id: 'user2',
              name: 'Sarah Chen',
              avatar: null,
              lastSeen: new Date(),
              isOnline: true,
            },
            lastMessage: {
              text: 'Hey! How\'s your savings goal going?',
              timestamp: new Date(Date.now() - 300000),
              senderId: 'user2',
            },
            unreadCount: 2,
          },
        ];
        setConversations(mockConversations);
        
        if (chatId) {
          const chat = mockConversations.find(c => c.id === chatId);
          setSelectedChat(chat);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user, chatId]);

  // Socket.IO connection and authentication
  useEffect(() => {
    if (user?.firebaseUser) {
      const connectSocket = async () => {
        try {
          // Get fresh Firebase ID token
          const token = await user.firebaseUser.getIdToken();
          
          // Connect to chat server
          socketService.connect(token);
          
          // Set up event listeners
          socketService.on('connection_status', ({ connected }) => {
            setIsConnected(connected);
            console.log(connected ? '✅ Connected to chat' : '❌ Disconnected from chat');
          });

          socketService.on('authenticated', (data) => {
            console.log('🔐 Socket authenticated:', data);
            setIsConnected(true);
          });

          socketService.on('authentication_error', (error) => {
            console.error('🚫 Socket authentication failed:', error);
            setIsConnected(false);
          });

          socketService.on('new_message', (message) => {
            console.log('💬 New message received:', message);
            setMessages(prev => [...prev, {
              id: message._id || message.id,
              text: message.content,
              senderId: message.senderId,
              timestamp: new Date(message.createdAt),
              status: 'delivered'
            }]);
          });

          socketService.on('message_sent', (message) => {
            console.log('✅ Message sent confirmation:', message);
            setMessages(prev => prev.map(msg => 
              msg.tempId === message.tempId 
                ? { ...msg, id: message._id, status: 'sent', tempId: undefined }
                : msg
            ));
          });

          socketService.on('user_typing', ({ userId, userName }) => {
            if (selectedChat && userId === selectedChat.participant.id) {
              setTypingUsers(prev => new Set([...prev, { userId, userName }]));
            }
          });

          socketService.on('user_stopped_typing', ({ userId }) => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              const userToRemove = [...newSet].find(user => user.userId === userId);
              if (userToRemove) newSet.delete(userToRemove);
              return newSet;
            });
          });

          socketService.on('user_status_change', ({ userId, isOnline }) => {
            if (isOnline) {
              setOnlineUsers(prev => new Set([...prev, userId]));
            } else {
              setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          });

          socketService.on('socket_error', (error) => {
            console.error('❌ Socket error:', error);
          });

        } catch (error) {
          console.error('Failed to connect to chat:', error);
          setIsConnected(false);
        }
      };

      connectSocket();

      // Join conversation when chat is selected
      if (selectedChat) {
        socketService.joinConversation(selectedChat.id);
      }

      return () => {
        if (selectedChat) {
          socketService.leaveConversation(selectedChat.id);
        }
        socketService.disconnect();
      };
    }
  }, [user, selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages for selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat || !user) return;
      
      try {
        setLoadingMessages(true);
        
        const response = await apiService.getConversation(selectedChat.participant.id);
        
        if (response.success) {
          // Transform backend messages to frontend format
          const transformedMessages = response.data.messages.map(msg => ({
            id: msg._id,
            text: msg.content,
            senderId: msg.sender._id || msg.sender,
            timestamp: new Date(msg.createdAt),
            status: msg.isRead ? 'read' : 'delivered',
            messageType: msg.messageType,
            attachmentUrl: msg.attachmentUrl,
          }));
          
          setMessages(transformedMessages);
          
          // Mark conversation as read
          await apiService.markConversationAsRead(selectedChat.participant.id);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        
        // Fallback to mock messages
        const mockMessages = [
          {
            id: '1',
            text: 'Hey! How\'s your savings goal going?',
            senderId: selectedChat.participant.id,
            timestamp: new Date(Date.now() - 300000),
            status: 'delivered',
          },
          {
            id: '2',
            text: 'Going pretty well! I\'m at 65% of my target now 💪',
            senderId: user?.id || 'user1',
            timestamp: new Date(Date.now() - 240000),
            status: 'read',
          },
        ];
        setMessages(mockMessages);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChat, user]);

  // Add this useEffect for navigation
  useEffect(() => {
    if (navigationPath) {
      navigate(navigationPath);
      setNavigationPath(null);
    }
  }, [navigationPath, navigate]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat && isConnected) {
      const tempId = `temp_${Date.now()}`;
      const messageText = newMessage.trim();
      
      // Add to local state immediately for optimistic UI
      const localMessage = {
        tempId,
        id: tempId,
        text: messageText,
        senderId: user?.id || 'user1',
        timestamp: new Date(),
        status: 'sending',
      };
      
      setMessages(prev => [...prev, localMessage]);
      setNewMessage('');
      
      try {
        // Send message via both API and socket
        const [apiResponse] = await Promise.all([
          apiService.sendMessage(selectedChat.participant.id, messageText),
          socketService.sendMessage(selectedChat.participant.id, messageText, 'text')
        ]);
        
        if (apiResponse.success) {
          // Update the temporary message with real data
          setMessages(prev => prev.map(msg => 
            msg.tempId === tempId 
              ? { 
                  ...msg, 
                  id: apiResponse.data.message._id, 
                  status: 'sent', 
                  tempId: undefined 
                }
              : msg
          ));
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Update message status to show error
        setMessages(prev => prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
      
      // Stop typing indicator
      socketService.stopTyping(selectedChat.participant.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (isConnected && selectedChat) {
      if (text.length > 0) {
        socketService.startTyping(selectedChat.participant.id);
      } else {
        socketService.stopTyping(selectedChat.participant.id);
      }
      
      // Clear typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (text.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.stopTyping(selectedChat.participant.id);
        }, 3000);
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const ChatList = () => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
    }}>
      {/* Search Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <TextField
          fullWidth
          placeholder="Search conversations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            },
          }}
        />
      </Box>

      {/* Conversations List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>Loading conversations...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {filteredConversations.map((conversation) => (
          <ListItem
            key={conversation.id}
            button
            selected={selectedChat?.id === conversation.id}
            onClick={() => {
              setSelectedChat(conversation);
              if (isMobile) setDrawerOpen(false);
              setNavigationPath(`/chat/${conversation.id}`);
            }}
            sx={{
              py: 2,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 158, 235, 0.2)' : 'rgba(76, 158, 235, 0.1)',
                borderRight: `3px solid ${theme.palette.primary.main}`,
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              },
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  onlineUsers.has(conversation.participant.id) || conversation.participant.isOnline ? (
                    <Circle sx={{ color: '#4caf50', fontSize: 12 }} />
                  ) : null
                }
              >
                <Avatar
                  src={conversation.participant.avatar}
                  sx={{ 
                    width: 48, 
                    height: 48,
                    border: selectedChat?.id === conversation.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                >
                  {conversation.participant.name[0]}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {conversation.participant.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(conversation.lastMessage.timestamp)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      mr: 1,
                    }}
                  >
                    {conversation.lastMessage.text}
                  </Typography>
                  {conversation.unreadCount > 0 && (
                    <Chip
                      label={conversation.unreadCount}
                      size="small"
                      color="primary"
                      sx={{ minWidth: 24, height: 20, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
        </List>
      )}

      {/* New Chat FAB */}
      <Fab
        color="primary"
        size="medium"
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          boxShadow: '0 4px 20px rgba(76, 158, 235, 0.3)',
        }}
        onClick={() => setNavigationPath('/chat/new')}
      >
        <PersonAdd />
      </Fab>
    </Box>
  );

  const ChatContent = () => {
    if (!selectedChat) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)'
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 400, px: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Welcome to FinSphere Chat
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a conversation to start messaging or create a new chat to connect with friends
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'rgba(26, 26, 26, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
            )}
            <Avatar
              src={selectedChat.participant.avatar}
              sx={{ mr: 2, width: 40, height: 40 }}
            >
              {selectedChat.participant.name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedChat.participant.name}
                </Typography>
                {/* Connection Status Indicator */}
                <Circle 
                  sx={{ 
                    fontSize: 8, 
                    color: isConnected ? '#4caf50' : '#f44336',
                    opacity: 0.8 
                  }} 
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {!isConnected ? (
                  'Connecting to chat...'
                ) : onlineUsers.has(selectedChat.participant.id) || selectedChat.participant.isOnline ? (
                  'Active now'
                ) : (
                  `Last seen ${formatTime(selectedChat.participant.lastSeen)}`
                )}
                {typingUsers.size > 0 && ' • typing...'}
              </Typography>
            </Box>
            <IconButton onClick={() => {}}>
              <VideoCall />
            </IconButton>
            <IconButton onClick={() => {}}>
              <Call />
            </IconButton>
            <IconButton onClick={(e) => setChatMenuAnchor(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, #1a1a1a 0%, #2c2c2c 100%)'
              : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
          }}
        >
          {loadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>Loading messages...</Typography>
            </Box>
          ) : (
            <>
              {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.senderId === 'user1' ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  borderRadius: 3,
                  background: message.senderId === 'user1'
                    ? 'linear-gradient(135deg, #4c9eeb 0%, #6bb6ff 100%)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                  color: message.senderId === 'user1' ? '#fff' : 'inherit',
                  borderBottomRightRadius: message.senderId === 'user1' ? 1 : 3,
                  borderBottomLeftRadius: message.senderId !== 'user1' ? 1 : 3,
                  boxShadow: message.senderId === 'user1' 
                    ? '0 4px 20px rgba(76, 158, 235, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography variant="body1">{message.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {formatTime(message.timestamp)}
                  {message.status === 'sending' && ' • Sending...'}
                  {message.status === 'sent' && ' • Sent'}
                  {message.status === 'delivered' && ' • ✓'}
                  {message.status === 'read' && ' • ✓✓'}
                  {message.status === 'failed' && ' • Failed to send'}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                  borderBottomLeftRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.3 }}>
                  {[0, 1, 2].map(i => (
                    <Box
                      key={i}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.text.secondary,
                        animation: 'typing 1.4s infinite',
                        animationDelay: `${i * 0.2}s`,
                        '@keyframes typing': {
                          '0%, 60%, 100%': {
                            transform: 'translateY(0)',
                            opacity: 0.5,
                          },
                          '30%': {
                            transform: 'translateY(-8px)',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {[...typingUsers].map(user => user.userName || selectedChat?.participant.name).join(', ')} typing...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
          </>
          )}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton>
              <AttachFile />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton>
                      <EmojiEmotions />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                },
              }}
            />
            {newMessage.trim() ? (
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                sx={{
                  background: 'linear-gradient(135deg, #4c9eeb 0%, #6bb6ff 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3d8bd4 0%, #5aa5eb 100%)',
                  },
                }}
              >
                <Send />
              </IconButton>
            ) : (
              <IconButton>
                <Mic />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', background: 'linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%)' }}>
      {/* Chat List Drawer/Sidebar */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { width: '85%', maxWidth: 400, borderRadius: 6, background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)', boxShadow: 3 },
          }}
        >
          <ChatList />
        </Drawer>
      ) : (
        <Paper
          sx={{
            width: 400,
            height: '100%',
            borderRadius: 0,
            background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
            boxShadow: 3,
          }}
        >
          <ChatList />
        </Paper>
      )}

      {/* Chat Content */}
      <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f6edff 0%, #e0f2fe 100%)' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <ChatContent />
        </Box>
        {/* Input Area */}
        <Box sx={{
          p: 2,
          background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
          borderTop: '1px solid #eaddff',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 -2px 12px rgba(103,80,164,0.06)',
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            sx={{
              borderRadius: 4,
              background: '#fff',
              boxShadow: 1,
              '& .MuiOutlinedInput-root': { borderRadius: 4 },
            }}
            InputProps={{
              endAdornment: (
                <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()} sx={{ ml: 1, borderRadius: 3, background: 'linear-gradient(135deg, #b69df8 0%, #eaddff 100%)', color: '#fff', boxShadow: 2, '&:hover': { background: 'linear-gradient(135deg, #eaddff 0%, #b69df8 100%)' } }}>
                  <Send />
                </IconButton>
              ),
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
          />
        </Box>
      </Box>

      {/* Chat Menu */}
      <Menu
        anchorEl={chatMenuAnchor}
        open={Boolean(chatMenuAnchor)}
        onClose={() => setChatMenuAnchor(null)}
      >
        <MenuItem onClick={() => setChatMenuAnchor(null)}>
          View Profile
        </MenuItem>
        <MenuItem onClick={() => setChatMenuAnchor(null)}>
          Mute Notifications
        </MenuItem>
        <MenuItem onClick={() => setChatMenuAnchor(null)}>
          Block User
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatPage;
