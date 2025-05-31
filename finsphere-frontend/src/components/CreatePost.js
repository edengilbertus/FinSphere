import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Avatar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton,
  Typography,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import ImageUpload from './ImageUpload'; // Assuming ImageUpload handles file selection and preview
import { useAuth } from '../context/AuthContext';

const CreatePost = ({ open, onClose, onPostCreated }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null); // Stores the image URL after upload
  const [imageFile, setImageFile] = useState(null); // Stores the selected file for upload
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelected = (file) => {
    setImageFile(file); // Store the file object
    // Optionally, generate a local preview URL if ImageUpload doesn't handle it
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Set local preview
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };
  
  const handleImageUploadSuccess = (uploadResult) => {
    // This function is called by ImageUpload component upon successful upload
    // It should provide the URL of the uploaded image
    setImage(uploadResult.url); // Set the final image URL from GCS or server
    setImageFile(null); // Clear the local file
    setUploading(false);
  };

  const handleImageUploadError = (err) => {
    setError('Image upload failed: ' + err.message);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) {
      setError('Please add content or an image to your post.');
      return;
    }
    setError('');
    
    // If there's an imageFile selected but not yet uploaded by ImageUpload component,
    // trigger its upload first. This depends on ImageUpload's implementation.
    // For now, we assume ImageUpload handles its own upload trigger or provides a URL directly.
    // The `onPostCreated` should receive the final image URL.

    onPostCreated({ content, image }); // Pass content and final image URL
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setContent('');
    setImage(null);
    setImageFile(null);
    setError('');
    setUploading(false);
    onClose();
  };

  const authorName = user?.profile?.fullName || user?.email || 'User';
  const authorAvatar = user?.profile?.profilePictureUrl;
  const authorInitials = user?.profile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <Dialog 
      open={open} 
      onClose={handleCloseDialog} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4, // Material You rounding
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 1.5,
        px: 2
      }}>
        <Typography variant="h6" fontWeight="medium">Create Post</Typography>
        <IconButton onClick={handleCloseDialog} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important', px: 2 }}> {/* Important to override MUI default */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar 
              src={authorAvatar}
              sx={{ width: 40, height: 40, mt: 0.5, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
            >
              {authorInitials}
            </Avatar>
            <TextField
              fullWidth
              multiline
              minRows={3}
              variant="outlined"
              placeholder={`What's on your mind, ${user?.profile?.firstName || 'User'}?`}
              value={content}
              onChange={e => setContent(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </Box>
          
          {image && (
            <Box sx={{ textAlign: 'center', my: 1, position: 'relative' }}>
              <Box
                component="img"
                src={image}
                alt="Preview"
                sx={{
                  maxHeight: 300,
                  maxWidth: '100%',
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  objectFit: 'contain'
                }}
              />
              <IconButton 
                size="small"
                onClick={() => { setImage(null); setImageFile(null); }}
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  bgcolor: alpha(theme.palette.common.black, 0.5),
                  color: 'white',
                  '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.7) }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {error && <Typography color="error" variant="caption" sx={{ mt: 1 }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-between'
      }}>
        {/* ImageUpload component should ideally handle its own button appearance */}
        {/* For now, we use a simple button to trigger file selection if ImageUpload is basic */}
        <ImageUpload 
          type="post" 
          onUploadSuccess={handleImageUploadSuccess} 
          onUploadStart={() => setUploading(true)}
          onUploadError={handleImageUploadError}
          onFileSelect={handleImageSelected} // Pass this if ImageUpload can call it
          buttonVariant="icon" // Or 'button' if you prefer a styled button
        >
          {/* Child can be a custom button or icon */}
          <IconButton color="primary" disabled={uploading}>
            <PhotoCameraBackIcon />
          </IconButton>
        </ImageUpload>
        
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={uploading || (!content.trim() && !image)}
          sx={{ borderRadius: '100px', px: 3 }}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {uploading ? 'Posting...' : 'Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePost;
