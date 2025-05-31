import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  ListItemIcon,
  ListItemText,
  InputBase,
  alpha,
  Badge,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  AccountCircle,
  Settings,
  Logout,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  MailOutline as MailIcon,
  Brightness4,
  Brightness7,
  Person,
  Tune,
  Help
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme, sourceColor, setSourceColor } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [navigationPath, setNavigationPath] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    if (navigationPath) {
      navigate(navigationPath);
      setNavigationPath(null);
    }
  }, [navigationPath, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      setNavigationPath('/login');
      setAnchorEl(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMessages = () => {
    setHasUnreadMessages(false);
    navigate('/chat');
  };

  const handleNotifications = () => {
    setNotificationCount(0);
    navigate('/notifications');
  };

  // Don't show navbar on login/register pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  // Hide Navbar on mobile if BottomNav is present
  if (isMobile) {
    return null;
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.surfaceContainerLow
          : theme.palette.surfaceBright,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
        height: 72,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        {/* Left section - Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h5"
            onClick={() => navigate('/feed')}
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
              letterSpacing: '-0.5px',
              fontSize: '1.4rem',
            }}
          >
            FinSphere
          </Typography>
        </Box>

        {/* Center section - Search Bar (Desktop) */}
        <Paper
          elevation={0}
          sx={{ 
            flexGrow: 1, 
            maxWidth: 600, 
            mx: 2,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.mode === 'dark' 
              ? theme.palette.surfaceContainerHigh
              : theme.palette.surfaceContainerLow, 1),
            borderRadius: 100, // Pill shape
            padding: '6px 16px',
            transition: 'all 0.2s ease-in-out',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.mode === 'dark' 
                ? theme.palette.surfaceContainerHighest
                : theme.palette.surfaceContainer, 1),
              boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
            }
          }}
        >
          <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
          <InputBase
            placeholder="Search FinSphere..."
            fullWidth
            sx={{
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              '& .MuiInputBase-input': {
                padding: '8px 0',
              }
            }}
          />
          <Tooltip title="Advanced search">
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <Tune fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Right section - Icons and User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                color: theme.palette.text.secondary,
                backgroundColor: alpha(theme.palette.mode === 'dark' 
                  ? theme.palette.surfaceContainerHigh
                  : theme.palette.surfaceContainerLow, 1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.mode === 'dark' 
                    ? theme.palette.surfaceContainerHighest
                    : theme.palette.surfaceContainer, 1),
                },
                width: 40,
                height: 40,
              }}
            >
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>

          {user ? (
            <>
              <Tooltip title="Messages">
                <IconButton 
                  onClick={handleMessages}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    backgroundColor: alpha(theme.palette.mode === 'dark' 
                      ? theme.palette.surfaceContainerHigh
                      : theme.palette.surfaceContainerLow, 1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.mode === 'dark' 
                        ? theme.palette.surfaceContainerHighest
                        : theme.palette.surfaceContainer, 1),
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <Badge color="error" variant="dot" invisible={!hasUnreadMessages}>
                    <MailIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Notifications">
                <IconButton 
                  onClick={handleNotifications}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    backgroundColor: alpha(theme.palette.mode === 'dark' 
                      ? theme.palette.surfaceContainerHigh
                      : theme.palette.surfaceContainerLow, 1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.mode === 'dark' 
                        ? theme.palette.surfaceContainerHighest
                        : theme.palette.surfaceContainer, 1),
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <Badge badgeContent={notificationCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Avatar & Menu */}
              <Box sx={{ ml: 0.5 }}>
                <Tooltip title="Account">
                  <IconButton 
                    onClick={handleProfileMenuOpen} 
                    sx={{ 
                      p: 0.5,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <Avatar
                      src={user.profile?.profilePictureUrl}
                      sx={{
                        width: 32,
                        height: 32,
                      }}
                    >
                      {user.profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Button
              variant="contained"
              disableElevation
              onClick={() => setNavigationPath('/login')}
              sx={{ 
                borderRadius: 100,
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: 'none',
                boxShadow: 'none',
                fontSize: '0.95rem',
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* User Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 3, // Material You rounding
            mt: 1.5,
            minWidth: 280,
            overflow: 'visible', // For potential triangle pointer
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
            backgroundColor: theme.palette.mode === 'dark'
              ? theme.palette.surfaceContainer
              : theme.palette.surfaceBright,
            '&:before': { // Triangle pointer
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 12,
              height: 12,
              bgcolor: theme.palette.mode === 'dark'
                ? theme.palette.surfaceContainer
                : theme.palette.surfaceBright,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          },
        }}
      >
        {user && (
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={user.profile?.profilePictureUrl}
              sx={{ 
                width: 48, 
                height: 48,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              {user.profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.profile?.fullName || user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={() => {
            navigate('/profile');
            handleProfileMenuClose();
          }}
          sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}
        >
          <ListItemIcon>
            <Person fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Your Profile" 
            primaryTypographyProps={{ 
              variant: 'body1',
              fontWeight: 500,
            }} 
          />
        </MenuItem>

        <MenuItem 
          onClick={() => {
            navigate('/settings');
            handleProfileMenuClose();
          }}
          sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}
        >
          <ListItemIcon>
            <Settings fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ 
              variant: 'body1',
              fontWeight: 500,
            }} 
          />
        </MenuItem>

        <MenuItem 
          onClick={() => {
            navigate('/help');
            handleProfileMenuClose();
          }}
          sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}
        >
          <ListItemIcon>
            <Help fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText 
            primary="Help & Support" 
            primaryTypographyProps={{ 
              variant: 'body1',
              fontWeight: 500,
            }} 
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5, 
            px: 2, 
            borderRadius: 2, 
            mx: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            }
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ 
              variant: 'body1',
              fontWeight: 500,
              color: theme.palette.error.main,
            }} 
          />
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
