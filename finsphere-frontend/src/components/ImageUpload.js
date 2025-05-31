import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Avatar,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  PhotoCamera,
  CropOriginal,
} from '@mui/icons-material';
import apiService from '../services/api';

const ImageUpload = ({
  type = 'avatar', // 'avatar', 'cover', 'post'
  currentImage = null,
  onUploadSuccess = () => {},
  onUploadError = () => {},
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  showPreview = true,
  buttonVariant = 'icon', // 'icon', 'button', 'avatar'
  children,
  sx = {},
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef(null);

  // Check if uploads are enabled from env vars
  const uploadsEnabled = process.env.REACT_APP_ENABLE_FILE_UPLOADS !== 'false';

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if uploads are enabled
    if (!uploadsEnabled) {
      showSnackbar('File uploads are currently disabled', 'warning');
      return;
    }

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      showSnackbar(`Please select a valid image file (${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')})`, 'error');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      showSnackbar(`File size must be less than ${maxSizeMB}MB`, 'error');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      if (showPreview) {
        setDialogOpen(true);
      } else {
        handleUpload(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (file) => {
    if (!file && !fileInputRef.current?.files?.[0]) return;
    
    // Check if uploads are enabled
    if (!uploadsEnabled) {
      showSnackbar('File uploads are currently disabled', 'warning');
      return;
    }
    
    const uploadFile = file || fileInputRef.current.files[0];
    
    try {
      setUploading(true);
      let response;

      switch (type) {
        case 'avatar':
          response = await apiService.uploadAvatar(uploadFile);
          break;
        case 'cover':
          response = await apiService.uploadCoverPhoto(uploadFile);
          break;
        case 'post':
          response = await apiService.uploadPostImages([uploadFile]);
          break;
        default:
          throw new Error('Invalid upload type');
      }

      showSnackbar(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, 'success');
      onUploadSuccess(response.data || response);
      setDialogOpen(false);
      setPreview(null);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to upload ${type}`;
      showSnackbar(errorMessage, 'error');
      onUploadError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    // Check if uploads are enabled before showing file picker
    if (!uploadsEnabled) {
      showSnackbar('File uploads are currently disabled', 'warning');
      return;
    }
    fileInputRef.current?.click();
  };

  const renderButton = () => {
    if (children) {
      return (
        <Box onClick={handleButtonClick} sx={{ cursor: 'pointer', ...sx }}>
          {children}
        </Box>
      );
    }

    switch (buttonVariant) {
      case 'icon':
        return (
          <IconButton
            onClick={handleButtonClick}
            disabled={uploading}
            sx={sx}
          >
            {uploading ? <CircularProgress size={24} /> : <PhotoCamera />}
          </IconButton>
        );
      
      case 'avatar':
        return (
          <Avatar
            src={currentImage}
            onClick={handleButtonClick}
            sx={{
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
              ...sx
            }}
          >
            {uploading ? <CircularProgress size={24} /> : <PhotoCamera />}
          </Avatar>
        );
      
      case 'button':
      default:
        return (
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            onClick={handleButtonClick}
            disabled={uploading}
            sx={sx}
          >
            {uploading ? 'Uploading...' : `Upload ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </Button>
        );
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload button/trigger */}
      {renderButton()}

      {/* Preview dialog */}
      {showPreview && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Upload {type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          
          <DialogContent>
            {preview && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                {type === 'avatar' ? (
                  <Avatar
                    src={preview}
                    sx={{ width: 200, height: 200 }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={preview}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: type === 'cover' ? 300 : 400,
                      borderRadius: 2,
                      objectFit: 'cover',
                    }}
                  />
                )}
              </Box>
            )}
            
            <Typography variant="body2" color="text.secondary" align="center">
              {type === 'avatar' && 'This will be your profile picture visible to other users.'}
              {type === 'cover' && 'This will be your cover photo displayed on your profile.'}
              {type === 'post' && 'This image will be added to your post.'}
            </Typography>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleUpload()}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ImageUpload;
