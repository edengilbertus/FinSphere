import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Snackbar,
  useTheme,
  Grid,
  Paper,
  Fab,
  Avatar,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Skeleton,
  Button,
  alpha,
  Stack,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Savings as SavingsIcon,
  Paid as PaidIcon
} from '@mui/icons-material';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';
import Stories from '../components/Stories';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mock data for demonstration
const MOCK_POSTS = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'Valentina Nakibuule',
      profilePicture: 'https://randomuser.me/api/portraits/women/52.jpg',
      role: 'Financial Advisor'
    },
    content: 'Just launched my new financial planning service! 🚀 Offering personalized investment strategies and retirement planning advice. Book a free consultation through the link in my profile.',
    image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    createdAt: '2023-07-15T10:00:00.000Z',
    likeCount: 48,
    commentCount: 12,
    isLiked: false,
    isBookmarked: true,
    comments: []
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Daniel Mawejje',
      profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
      role: 'Investment Analyst'
    },
    content: 'Stock market update: Tech stocks are showing strong performance this quarter. Particularly keep an eye on AI-focused companies as they continue to innovate and disrupt various sectors. #FinancialTips #Investing',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    createdAt: '2023-07-14T14:30:00.000Z',
    likeCount: 76,
    commentCount: 23,
    isLiked: true,
    isBookmarked: false,
    comments: []
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Sarah Nanteza',
      profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
      role: 'Financial Literacy Coach'
    },
    content: 'Today\'s financial tip: Start building your emergency fund! Aim for 3-6 months of expenses in a high-yield savings account. This provides a crucial safety net for unexpected situations. What\'s your saving strategy? #FinancialFreedom',
    image: null,
    createdAt: '2023-07-13T09:15:00.000Z',
    likeCount: 124,
    commentCount: 43,
    isLiked: false,
    isBookmarked: true,
    comments: []
  },
];

// Mock stories data
const MOCK_STORIES = [
  { id: 1, user: { name: 'Your Story', image: 'https://randomuser.me/api/portraits/lego/1.jpg' }, isViewed: false, isOwn: true },
  { id: 2, user: { name: 'Jane', image: 'https://randomuser.me/api/portraits/women/23.jpg' }, isViewed: false },
  { id: 3, user: { name: 'Mike', image: 'https://randomuser.me/api/portraits/men/41.jpg' }, isViewed: false },
  { id: 4, user: { name: 'Sarah', image: 'https://randomuser.me/api/portraits/women/68.jpg' }, isViewed: true },
  { id: 5, user: { name: 'David', image: 'https://randomuser.me/api/portraits/men/81.jpg' }, isViewed: true },
  { id: 6, user: { name: 'Emma', image: 'https://randomuser.me/api/portraits/women/90.jpg' }, isViewed: false },
];

// Mock financial suggestions
const MOCK_FINANCIAL_TIPS = [
  { id: 1, title: 'Invest in ETFs', icon: <TrendingUpIcon color="primary" /> },
  { id: 2, title: 'Start a Retirement Fund', icon: <SavingsIcon color="secondary" /> },
  { id: 3, title: 'Build Emergency Savings', icon: <PaidIcon sx={{ color: '#4CAF50' }} /> },
];

const FeedPage = () => {
  const [posts, setPosts] = useState(MOCK_POSTS); // Using mock data initially
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const prevPostsRef = useRef([]);
  const theme = useTheme();
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    // In a real app, we'd fetch from API
    // Keeping this method for demonstration and potential real API integration
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, use mock data but in real app:
      // const data = await apiService.getPosts(1, 20);
      // const newPosts = data.data?.posts || [];
      
      const newPosts = [...MOCK_POSTS];
      
      prevPostsRef.current = newPosts;
      setPosts(newPosts);
    } catch (err) {
      setError('Failed to load posts');
      setNotification({ message: 'Failed to load posts', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchPosts();
    // No need for interval in demo, but would be good for real app
  }, [fetchPosts]);

  const handleCreatePost = async (postData) => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new mock post
      const newPost = {
        id: `new-${Date.now()}`,
        user: {
          id: user?.uid || 'current-user',
          name: user?.profile?.fullName || 'Current User',
          profilePicture: user?.profile?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
          role: 'FinSphere User'
        },
        content: postData.content,
        image: postData.image || null,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isBookmarked: false,
        comments: []
      };
      
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setNotification({ message: 'Post created successfully!', type: 'success' });
      setIsCreatePostOpen(false);
    } catch (err) {
      setError('Failed to create post');
      setNotification({ message: 'Failed to create post', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLikeUpdate = (postId, updatedLikeStatus) => {
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === postId 
        ? { 
            ...p, 
            isLiked: updatedLikeStatus, 
            likeCount: updatedLikeStatus ? p.likeCount + 1 : p.likeCount - 1 
          } 
        : p
      )
    );
  };

  const handleBookmarkUpdate = (postId, isBookmarked) => {
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === postId 
        ? { ...p, isBookmarked } 
        : p
      )
    );
    setNotification({ 
      message: isBookmarked ? 'Post saved to bookmarks' : 'Post removed from bookmarks', 
      type: 'success' 
    });
  };

  const renderPost = (post) => (
    <Card
      key={post.id}
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.surfaceContainerLow
          : theme.palette.surfaceBright,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 6px 20px rgba(0,0,0,0.3)'
            : '0 6px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar 
            src={post.user.profilePicture} 
            alt={post.user.name}
            sx={{ 
              border: `2px solid ${theme.palette.primary.main}`,
              width: 48,
              height: 48
            }}
          />
        }
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {post.user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {post.user.role}
            </Typography>
          </Box>
        }
        subheader={new Date(post.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        sx={{ 
          px: 3, 
          pt: 2,
          '& .MuiCardHeader-title': { fontWeight: 600 }
        }}
      />
      <CardContent sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body1" sx={{ mb: post.image ? 2 : 0 }}>
          {post.content}
        </Typography>
      </CardContent>
      
      {post.image && (
        <CardMedia
          component="img"
          height="300"
          image={post.image}
          alt="Post image"
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardActions sx={{ px: 2, py: 1 }}>
        <IconButton 
          aria-label="like"
          onClick={() => handleLikeUpdate(post.id, !post.isLiked)}
          sx={{ 
            color: post.isLiked ? 'error.main' : 'text.secondary',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          {post.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {post.likeCount}
        </Typography>
        
        <IconButton 
          aria-label="comment"
          sx={{ 
            color: 'text.secondary',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {post.commentCount}
        </Typography>
        
        <IconButton 
          aria-label="share"
          sx={{ 
            color: 'text.secondary',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          <ShareIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton 
          aria-label="bookmark"
          onClick={() => handleBookmarkUpdate(post.id, !post.isBookmarked)}
          sx={{ 
            color: post.isBookmarked ? 'primary.main' : 'text.secondary',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          {post.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)',
      bgcolor: theme.palette.mode === 'dark'
        ? theme.palette.background
        : theme.palette.surfaceContainerLowest,
      pt: { xs: 2, md: 3 }, 
      pb: { xs: 10, md: 4 }
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Left Column (Desktop) - For navigation or user info */}
          <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                position: 'sticky', 
                top: 80,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={user?.profile?.profilePictureUrl || "https://randomuser.me/api/portraits/lego/1.jpg"} 
                  alt={user?.profile?.fullName || "User"}
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    mr: 2,
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {user?.profile?.fullName || user?.email?.split('@')[0] || "Welcome!"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View your profile
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Financial Highlights
              </Typography>
              
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      mr: 2
                    }}
                  >
                    <AttachMoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Current Balance</Typography>
                    <Typography variant="h6" fontWeight={600}>$4,250.00</Typography>
                  </Box>
                </Paper>
                
                <Paper
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      color: theme.palette.secondary.main,
                      mr: 2
                    }}
                  >
                    <SavingsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Savings Goal</Typography>
                    <Typography variant="h6" fontWeight={600}>$10,000.00</Typography>
                  </Box>
                </Paper>
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Quick Links
              </Typography>
              
              <Stack spacing={1}>
                <Button variant="outlined" fullWidth sx={{ borderRadius: 100, justifyContent: 'flex-start', px: 2 }}>
                  My Portfolio
                </Button>
                <Button variant="outlined" fullWidth sx={{ borderRadius: 100, justifyContent: 'flex-start', px: 2 }}>
                  Financial Planner
                </Button>
                <Button variant="outlined" fullWidth sx={{ borderRadius: 100, justifyContent: 'flex-start', px: 2 }}>
                  Budget Tracker
                </Button>
              </Stack>
            </Card>
          </Grid>

          {/* Center Column - Feed Content */}
          <Grid item xs={12} md={6}>
            {/* Stories */}
            <Card
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', overflowX: 'auto', pb: 1 }}>
                {MOCK_STORIES.map((story) => (
                  <Box 
                    key={story.id} 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      mr: 2.5,
                      minWidth: 'auto',
                    }}
                  >
                    <Avatar 
                      src={story.user.image} 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        mb: 1,
                        border: story.isViewed 
                          ? `2px solid ${alpha(theme.palette.divider, 0.5)}`
                          : story.isOwn
                            ? `2px solid ${theme.palette.primary.main}`
                            : `2px solid ${theme.palette.secondary.main}`,
                        padding: 0.5,
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: story.isViewed ? 'text.secondary' : 'text.primary',
                        fontWeight: story.isViewed ? 400 : 500,
                        fontSize: '0.7rem',
                      }}
                    >
                      {story.user.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
            
            {/* Create Post Button */}
            <Card
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={user?.profile?.profilePictureUrl || "https://randomuser.me/api/portraits/lego/1.jpg"} 
                  alt={user?.profile?.fullName || "User"}
                  sx={{ mr: 2 }}
                />
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => setIsCreatePostOpen(true)}
                  sx={{ 
                    borderRadius: 100,
                    py: 1.2,
                    justifyContent: 'flex-start',
                    pl: 3,
                    color: theme.palette.text.secondary,
                    borderColor: alpha(theme.palette.divider, 0.5),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    }
                  }}
                >
                  What's on your mind?
                </Button>
              </Box>
            </Card>
            
            {/* Financial Tips Cards */}
            <Card
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, px: 1 }}>
                Financial Tips For You
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {MOCK_FINANCIAL_TIPS.map(tip => (
                  <Chip
                    key={tip.id}
                    icon={tip.icon}
                    label={tip.title}
                    clickable
                    sx={{ 
                      borderRadius: 100,
                      py: 2.5,
                      px: 1,
                      '& .MuiChip-label': { fontWeight: 500 },
                      '& .MuiChip-icon': { ml: 1 },
                    }}
                  />
                ))}
              </Box>
            </Card>

            {/* Create Post Modal */}
            <CreatePost 
              open={isCreatePostOpen} 
              onClose={() => setIsCreatePostOpen(false)} 
              onPostCreated={handleCreatePost} 
            />

            {error && !notification && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                }}
              >
                {error}
              </Alert>
            )}
            
            {/* Posts */}
            {loading && posts.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1, 2, 3].map((skeleton) => (
                  <Card
                    key={`skeleton-${skeleton}`}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.surfaceContainerLow
                        : theme.palette.surfaceBright,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardHeader
                      avatar={<Skeleton variant="circular" width={48} height={48} />}
                      title={<Skeleton variant="text" width="60%" />}
                      subheader={<Skeleton variant="text" width="40%" />}
                      action={<Skeleton variant="circular" width={24} height={24} />}
                      sx={{ px: 3, pt: 2 }}
                    />
                    <CardContent sx={{ px: 3, py: 1.5 }}>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="90%" />
                      <Skeleton variant="text" width="80%" />
                    </CardContent>
                    <Skeleton variant="rectangular" height={200} />
                    <CardActions sx={{ px: 2, py: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={20} sx={{ mx: 1 }} />
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={20} sx={{ mx: 1 }} />
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box sx={{ flexGrow: 1 }} />
                      <Skeleton variant="circular" width={36} height={36} />
                    </CardActions>
                  </Card>
                ))}
              </Box>
            ) : posts.length === 0 && !loading ? (
              <Card
                elevation={0}
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? theme.palette.surfaceContainerLow
                    : theme.palette.surfaceBright,
                }}
              >
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                  No posts yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                  Be the first to share something!
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setIsCreatePostOpen(true)}
                  sx={{ borderRadius: 100, px: 3, py: 1 }}
                >
                  Create a Post
                </Button>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {posts.map(post => renderPost(post))}
              </Box>
            )}
          </Grid>

          {/* Right Column (Desktop) - For trends, suggestions */}
          <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                position: 'sticky', 
                top: 80,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                mb: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Market Trends
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#0288d1', width: 32, height: 32, mr: 1.5, fontSize: '0.9rem' }}>
                      S&P
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>S&P 500</Typography>
                      <Typography variant="caption" color="text.secondary">US Market</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>4,873.21</Typography>
                    <Typography variant="caption" color="success.main">+1.21%</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#5c6bc0', width: 32, height: 32, mr: 1.5, fontSize: '0.9rem' }}>
                      BTC
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Bitcoin</Typography>
                      <Typography variant="caption" color="text.secondary">Cryptocurrency</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>$42,567.89</Typography>
                    <Typography variant="caption" color="error.main">-2.05%</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#43a047', width: 32, height: 32, mr: 1.5, fontSize: '0.9rem' }}>
                      EUR
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>EUR/USD</Typography>
                      <Typography variant="caption" color="text.secondary">Forex</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>1.0823</Typography>
                    <Typography variant="caption" color="success.main">+0.34%</Typography>
                  </Box>
                </Box>
              </Stack>
              
              <Button 
                fullWidth 
                variant="text" 
                sx={{ mt: 2, borderRadius: 100 }}
              >
                View All Markets
              </Button>
            </Card>
            
            <Card
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerLow
                  : theme.palette.surfaceBright,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Financial Advisors
              </Typography>
              
              <Stack spacing={2}>
                {[
                  { name: 'Amanda Johnson', role: 'Retirement Specialist', image: 'https://randomuser.me/api/portraits/women/45.jpg' },
                  { name: 'Michael Chen', role: 'Investment Advisor', image: 'https://randomuser.me/api/portraits/men/36.jpg' },
                  { name: 'Sophia Williams', role: 'Tax Consultant', image: 'https://randomuser.me/api/portraits/women/22.jpg' },
                ].map((advisor, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={advisor.image} sx={{ width: 40, height: 40, mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{advisor.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{advisor.role}</Typography>
                    </Box>
                    <Button 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderRadius: 100,
                        minWidth: 'auto',
                        px: 2,
                      }}
                    >
                      Follow
                    </Button>
                  </Box>
                ))}
              </Stack>
              
              <Button 
                fullWidth 
                variant="text" 
                sx={{ mt: 2, borderRadius: 100 }}
              >
                View All Advisors
              </Button>
            </Card>
          </Grid>
        </Grid>

        <Snackbar
          open={!!notification}
          autoHideDuration={4000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 70, sm: 20 } }}
        >
          <Alert 
            onClose={() => setNotification(null)} 
            severity={notification?.type || 'info'} 
            variant="filled"
            sx={{ 
              width: '100%', 
              boxShadow: theme.shadows[6],
              borderRadius: 3,
            }}
          >
            {notification?.message}
          </Alert>
        </Snackbar>
        
        {/* FAB for creating post on mobile */}
        <Fab 
          color="primary" 
          aria-label="add post" 
          onClick={() => setIsCreatePostOpen(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            display: { md: 'none' },
            width: 60,
            height: 60,
            boxShadow: theme.shadows[6],
          }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>
      </Container>
    </Box>
  );
};

export default FeedPage;
