import React, { useState } from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Dialog, 
  DialogContent, 
  IconButton,
  Paper,
  useTheme,
  LinearProgress,
  alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // For "Add Story"

const mockStories = [
  {
    id: 1,
    user: { name: 'Jane D.', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    viewed: false,
  },
  {
    id: 2,
    user: { name: 'John S.', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    viewed: true,
  },
  {
    id: 3,
    user: { name: 'Alice B.', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
    viewed: false,
  },
  {
    id: 4,
    user: { name: 'Bob K.', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    image: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=600&q=80',
    viewed: false,
  },
  {
    id: 5,
    user: { name: 'Carol P.', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80',
    viewed: true,
  },
];

const Stories = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [stories, setStories] = useState(mockStories); // To manage viewed state

  const handleOpen = (story) => {
    setActiveStory(story);
    setOpen(true);
    // Mark story as viewed
    setStories(prevStories => 
      prevStories.map(s => s.id === story.id ? { ...s, viewed: true } : s)
    );
  };

  const handleClose = () => {
    setOpen(false);
    setActiveStory(null);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        display: 'flex', 
        gap: 1.5, 
        overflowX: 'auto', 
        mb: 3, 
        py: 1.5, 
        px: 2,
        bgcolor: 'transparent', // Make paper transparent, rely on page background
        borderRadius: 3,
        // Hide scrollbar for a cleaner look
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none', // For Firefox
        msOverflowStyle: 'none', // For IE and Edge
      }}
    >
      {/* Add Your Story Button */}
      <Box
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          cursor: 'pointer',
          minWidth: 70, // Ensure consistent width
          textAlign: 'center',
        }}
        onClick={() => console.log("Add story clicked")} // Placeholder action
      >
        <Avatar
          sx={{ 
            width: 60, 
            height: 60, 
            mb: 0.5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `2px dashed ${theme.palette.primary.main}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        >
          <AddCircleOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        </Avatar>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Your Story
        </Typography>
      </Box>

      {/* Existing Stories */}
      {stories.map(story => (
        <Box
          key={story.id}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            cursor: 'pointer',
            minWidth: 70, // Ensure consistent width
            textAlign: 'center',
          }}
          onClick={() => handleOpen(story)}
        >
          <Avatar
            src={story.user.avatar}
            alt={story.user.name}
            sx={{ 
              width: 60, 
              height: 60, 
              border: story.viewed 
                ? `2px solid ${theme.palette.divider}` 
                : `3px solid ${theme.palette.primary.main}`,
              mb: 0.5,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            {!story.user.avatar && story.user.name[0]}
          </Avatar>
          <Typography 
            variant="caption" 
            color={story.viewed ? "text.disabled" : "text.primary"}
            sx={{ 
              fontWeight: story.viewed ? 400 : 500,
              maxWidth: 65, // Prevent long names from breaking layout
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {story.user.name}
          </Typography>
        </Box>
      ))}
      
      {/* Story Viewer Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="xs" // Smaller dialog for story view
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4, // Material You rounding
            overflow: 'hidden', // Ensure content respects border radius
            height: '80vh', // Make it taller
            maxHeight: '600px',
            bgcolor: 'background.default'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {activeStory && (
            <>
              <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={activeStory.user.avatar} sx={{ width: 32, height: 32 }} />
                <Typography variant="subtitle2" fontWeight="medium">{activeStory.user.name}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <LinearProgress variant="determinate" value={50} sx={{ height: 2 }} /> {/* Placeholder progress */}
              <Box
                component="img"
                src={activeStory.image}
                alt="Story"
                sx={{ 
                  width: '100%', 
                  flexGrow: 1,
                  objectFit: 'cover', // Cover to fill space
                  display: 'block',
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default Stories;
