import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Avatar, 
  Typography, 
  IconButton, 
  TextField, 
  Button, 
  Divider, 
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder,
  ChatBubbleOutline,
  ShareOutlined,
  MoreHoriz,
  BookmarkBorder,
  Bookmark,
  ReportProblemOutlined,
  DeleteOutline
} from '@mui/icons-material';
import Comment from './Comment';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext'; // To get current user info

const Post = ({ post, onLikeUpdate, onCommentUpdate }) => {
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const theme = useTheme();
  const [liked, setLiked] = useState(post.isLikedByCurrentUser || post.isLiked || false);
  const [likes, setLikes] = useState(post.likeCount || post.likes?.length || 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // Sync with post prop if it changes (e.g., parent re-fetches)
    setLiked(post.isLikedByCurrentUser || post.isLiked || false);
    setLikes(post.likeCount || post.likes?.length || 0);
    setComments(post.comments || []);
  }, [post]);

  const handleLike = async () => {
    if (loadingLike) return;
    setLoadingLike(true);
    setError(null);
    try {
      const res = await apiService.likePost(post.id || post._id);
      const newLikedStatus = res.data?.isLiked ?? !liked;
      const newLikeCount = res.data?.likeCount ?? (newLikedStatus ? likes + 1 : Math.max(0, likes - 1));
      
      setLiked(newLikedStatus);
      setLikes(newLikeCount);
      if (onLikeUpdate) {
        onLikeUpdate(post.id || post._id, newLikedStatus, newLikeCount);
      }
    } catch (err) {
      setError('Failed to update like');
      console.error("Like error:", err);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || loadingComment) return;
    setLoadingComment(true);
    setError(null);
    try {
      const res = await apiService.commentOnPost(post.id || post._id, commentText.trim());
      const newComment = res.data?.comment || { 
        author: { 
          _id: currentUser?._id, 
          firstName: currentUser?.profile?.firstName || 'You', 
          lastName: currentUser?.profile?.lastName || '',
          profilePictureUrl: currentUser?.profile?.profilePictureUrl 
        }, 
        text: commentText.trim(),
        createdAt: new Date().toISOString()
      };
      setComments(prevComments => [...prevComments, newComment]);
      if (onCommentUpdate) {
        onCommentUpdate(post.id || post._id, newComment);
      }
      setCommentText('');
      setShowComments(true); // Ensure comments are visible after adding
    } catch (err) {
      setError('Failed to add comment');
      console.error("Comment error:", err);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeletePost = async () => {
    // Placeholder for delete functionality
    console.log("Deleting post:", post.id || post._id);
    // await apiService.deletePost(post.id || post._id);
    // Add logic to remove post from UI via callback to parent
    handleMenuClose();
  };
  
  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  const authorName = post.author?.name || `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Anonymous';
  const authorAvatar = post.author?.avatar || post.author?.profilePictureUrl;
  const authorInitials = authorName?.[0]?.toUpperCase();

  return (
    <Card sx={{ 
      mb: 3, 
      borderRadius: 4, // Material You rounding
      bgcolor: 'background.paper',
      boxShadow: theme.shadows[1], // Softer shadow
      '&:hover': {
        boxShadow: theme.shadows[3],
      }
    }}>
      <CardHeader
        avatar={
          <Avatar 
            src={authorAvatar}
            sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
          >
            {authorInitials}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings" onClick={handleMenuOpen}>
            <MoreHoriz />
          </IconButton>
        }
        title={
          <Typography variant="subtitle1" fontWeight="medium">
            {authorName}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {timeSince(post.createdAt)}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>
        {post.image && (
          <Box 
            component="img" 
            src={post.image} 
            alt="Post image" 
            sx={{ 
              width: '100%', 
              maxHeight: 500,
              objectFit: 'cover',
              borderRadius: 3, 
              mb: 1.5,
              border: `1px solid ${theme.palette.divider}`
            }} 
          />
        )}
      </CardContent>
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        px: 2, 
        pb: 1.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton 
            aria-label="like" 
            onClick={handleLike} 
            disabled={loadingLike}
            size="small"
            sx={{ 
              color: liked ? theme.palette.error.main : 'text.secondary',
              '&:hover': { bgcolor: alpha(liked ? theme.palette.error.main : theme.palette.action.active, 0.08) }
            }}
          >
            {liked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">{likes}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton 
            aria-label="comment" 
            onClick={() => setShowComments(!showComments)}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.08) }
            }}
          >
            <ChatBubbleOutline fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary">{comments.length}</Typography>
        </Box>
        <IconButton 
          aria-label="share"
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.08) }
          }}
        >
          <ShareOutlined fontSize="small" />
        </IconButton>
        <IconButton 
          aria-label="bookmark" 
          onClick={() => setBookmarked(!bookmarked)}
          size="small"
          sx={{ 
            color: bookmarked ? theme.palette.primary.main : 'text.secondary',
            '&:hover': { bgcolor: alpha(bookmarked ? theme.palette.primary.main : theme.palette.action.active, 0.08) }
          }}
        >
          {bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
        </IconButton>
      </CardActions>

      {showComments && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'medium' }}>
            Comments
          </Typography>
          {comments.length > 0 ? (
            comments.map(comment => (
              <Comment key={comment.id || comment._id} comment={comment} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No comments yet.
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
            <Avatar 
              src={currentUser?.profile?.profilePictureUrl}
              sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText }}
            >
              {currentUser?.profile?.firstName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={loadingComment}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '100px', // Pill shape
                  bgcolor: alpha(theme.palette.action.hover, 0.5)
                } 
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button 
              variant="contained" 
              size="small"
              onClick={handleAddComment} 
              disabled={loadingComment || !commentText.trim()}
              sx={{ borderRadius: '100px' }}
            >
              {loadingComment ? '...' : 'Post'}
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 3,
            minWidth: 180,
          },
        }}
      >
        {/* Add more menu items like Edit, Report, etc. */}
        {currentUser?._id === post.author?._id && (
          <MenuItem onClick={handleDeletePost} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteOutline fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Delete Post" />
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ReportProblemOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Report Post" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default Post;
