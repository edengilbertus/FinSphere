import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Edit,
  Camera,
  LocationOn,
  Work,
  CalendarToday,
  Email,
  Phone,
  Settings,
  Security,
  Notifications,
  Privacy,
  Help,
  ExitToApp,
  AccountBalance,
  TrendingUp,
  Group,
  Chat,
  PhotoCamera,
  Upload,
  PersonAdd,
  PersonRemove,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import ImageUpload from '../components/ImageUpload';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    occupation: '',
    bio: '',
  });
  const [stats, setStats] = useState({
    totalSavings: 12500.75,
    savingsGoals: 3,
    friends: 24,
    messagesCount: 156,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [error, setError] = useState(null);
  const isOwnProfile = true;
  const profileUserId = user?._id; // TODO: set to profile being viewed

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
        occupation: user.profile?.occupation || '',
        bio: user.profile?.bio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchFollowStats = async () => {
      try {
        setError(null);
        // Replace with actual profile user id if viewing another user
        const res = await apiService.getFollowStats(profileUserId);
        setFollowers(res.data?.stats?.followers || 0);
        setFollowing(res.data?.stats?.following || 0);
        setIsFollowing(res.data?.isFollowing || false);
      } catch (err) {
        setError('Failed to load follow stats');
      }
    };
    if (profileUserId) fetchFollowStats();
  }, [profileUserId]);

  // Effect to handle navigation after logout
  useEffect(() => {
    if (loggedOut) {
      navigate('/login');
    }
  }, [loggedOut, navigate]);

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      // await apiService.updateProfile(profileData);
      setEditDialogOpen(false);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAvatarUploadSuccess = (uploadData) => {
    // Update user profile with new avatar URL
    if (uploadData.avatarUrl) {
      // Update local state and potentially trigger a user context refresh
      console.log('Avatar uploaded successfully:', uploadData.avatarUrl);
    }
  };

  const handleCoverUploadSuccess = (uploadData) => {
    // Update user profile with new cover photo URL
    if (uploadData.coverPhotoUrl) {
      console.log('Cover photo uploaded successfully:', uploadData.coverPhotoUrl);
    }
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedOut(true);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleFollowToggle = async () => {
    setLoadingFollow(true);
    setError(null);
    try {
      if (isFollowing) {
        await apiService.unfollowUser(profileUserId);
        setIsFollowing(false);
        setFollowers(f => Math.max(0, f - 1));
      } else {
        await apiService.followUser(profileUserId);
        setIsFollowing(true);
        setFollowers(f => f + 1);
      }
    } catch (err) {
      setError('Failed to update follow status');
    } finally {
      setLoadingFollow(false);
    }
  };

  const ProfileContent = () => (
    <Box>
      {/* Cover Photo & Profile Section */}
      <Paper
        sx={{
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
          mb: 3,
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%)',
          boxShadow: 3,
        }}
      >
        {/* Cover Photo */}
        <Box
          sx={{
            height: 220,
            background: user?.profile?.coverPhotoUrl
              ? `url(${user.profile.coverPhotoUrl})`
              : 'linear-gradient(135deg, #b69df8 0%, #e0f2fe 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <ImageUpload
            type="cover"
            currentImage={user?.profile?.coverPhotoUrl}
            onUploadSuccess={handleCoverUploadSuccess}
            onUploadError={handleUploadError}
            maxSize={10 * 1024 * 1024} // 10MB for cover photos
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <IconButton
              sx={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <PhotoCamera />
            </IconButton>
          </ImageUpload>
        </Box>

        {/* Profile Info */}
        <Box sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, mt: -8 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user?.profile?.profilePictureUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: `4px solid #fff`,
                  fontSize: '2rem',
                  boxShadow: 2,
                }}
              >
                {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </Avatar>
              
              <ImageUpload
                type="avatar"
                currentImage={user?.profile?.profilePictureUrl}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleUploadError}
                maxSize={5 * 1024 * 1024} // 5MB for avatars
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                <IconButton
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
                  }}
                >
                  <Camera sx={{ fontSize: 16 }} />
                </IconButton>
              </ImageUpload>
            </Box>

            <Box sx={{ flex: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {profileData.firstName} {profileData.lastName}
                </Typography>
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing ? 'outlined' : 'contained'}
                    color={isFollowing ? 'secondary' : 'primary'}
                    startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
                    onClick={handleFollowToggle}
                    sx={{ borderRadius: 3, minWidth: 120 }}
                    disabled={loadingFollow}
                  >
                    {loadingFollow ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {profileData.occupation || 'Financial Enthusiast'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {profileData.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {profileData.location}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Joined May 2024
                  </Typography>
                </Box>
              </Box>
              {profileData.bio && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {profileData.bio}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{followers} Followers</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group color="secondary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{following} Following</Typography>
                </Box>
              </Box>
            </Box>

            {isOwnProfile && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditProfile}
                sx={{ alignSelf: 'flex-start', borderRadius: 3 }}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(76, 158, 235, 0.1)'
                : 'rgba(76, 158, 235, 0.05)',
            }}
          >
            <AccountBalance sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${stats.totalSavings.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Savings
            </Typography>
          </Card>
        </Grid>
        <Grid xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(156, 39, 176, 0.1)'
                : 'rgba(156, 39, 176, 0.05)',
            }}
          >
            <TrendingUp sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.savingsGoals}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Savings Goals
            </Typography>
          </Card>
        </Grid>
        <Grid xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(76, 175, 80, 0.05)',
            }}
          >
            <Group sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.friends}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Friends
            </Typography>
          </Card>
        </Grid>
        <Grid xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 152, 0, 0.1)'
                : 'rgba(255, 152, 0, 0.05)',
            }}
          >
            <Chat sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.messagesCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Messages
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity / Achievements */}
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recent Achievements
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="First Savings Goal Completed"
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 3 }}
          />
          <Chip
            label="5 Friends Connected"
            color="secondary"
            variant="outlined"
            sx={{ borderRadius: 3 }}
          />
          <Chip
            label="Budget Master"
            color="success"
            variant="outlined"
            sx={{ borderRadius: 3 }}
          />
        </Box>
      </Paper>
    </Box>
  );

  const SettingsContent = () => (
    <Box>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <List>
          <ListItem button>
            <ListItemIcon>
              <Notifications />
            </ListItemIcon>
            <ListItemText 
              primary="Notifications" 
              secondary="Manage your notification preferences"
            />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemIcon>
              <Privacy />
            </ListItemIcon>
            <ListItemText 
              primary="Privacy" 
              secondary="Control your privacy settings"
            />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText 
              primary="Security" 
              secondary="Manage account security and authentication"
            />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText 
              primary="Help & Support" 
              secondary="Get help and contact support"
            />
          </ListItem>
          <Divider />
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out" 
              secondary="Sign out of your account"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 100%)'
        : 'linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%)',
      pt: 3,
      pb: 10,
    }}>
      <Container maxWidth="lg">
        {/* Tabs */}
        <Paper sx={{ borderRadius: 4, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered={!isMobile}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab label="Profile" />
            <Tab label="Settings" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && <ProfileContent />}
        {activeTab === 1 && <SettingsContent />}

        {/* Edit Profile Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    firstName: e.target.value
                  }))}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    lastName: e.target.value
                  }))}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    location: e.target.value
                  }))}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    occupation: e.target.value
                  }))}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    bio: e.target.value
                  }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProfilePage;
