import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';

const Comment = ({ comment }) => {
  const theme = useTheme();

  const authorName = comment.author?.name || 
                     `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() || 
                     'Anonymous';
  const authorAvatar = comment.author?.avatar || comment.author?.profilePictureUrl;
  const authorInitials = authorName?.[0]?.toUpperCase();

  const timeSince = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1.5, 
      mb: 1.5, 
      alignItems: 'flex-start' 
    }}>
      <Avatar 
        src={authorAvatar}
        sx={{ 
          width: 32, 
          height: 32, 
          mt: 0.5,
          bgcolor: theme.palette.secondary.light, 
          color: theme.palette.secondary.contrastText,
          fontSize: '0.875rem'
        }}
      >
        {authorInitials}
      </Avatar>
      <Box sx={{
        bgcolor: alpha(theme.palette.action.hover, 0.7), // Slightly transparent background
        p: 1.5,
        borderRadius: 3, // Rounded corners
        flexGrow: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
            {authorName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeSince(comment.createdAt)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
          {comment.text || comment.content}
        </Typography>
      </Box>
    </Box>
  );
};

export default Comment;
