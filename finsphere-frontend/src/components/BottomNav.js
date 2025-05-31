import React, { useState, useEffect } from 'react';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  Badge,
  useMediaQuery,
  useTheme,
  Box,
  alpha
} from '@mui/material';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [value, setValue] = useState('feed');
  const [notificationCount, setNotificationCount] = useState(2); // Mock notification count

  useEffect(() => {
    // Map current path to navigation value
    const path = location.pathname;
    if (path === '/feed' || path === '/') {
      setValue('feed');
    } else if (path === '/search') {
      setValue('search');
    } else if (path === '/create') {
      setValue('create');
    } else if (path === '/notifications') {
      setValue('notifications');
    } else if (path === '/profile') {
      setValue('profile');
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    
    // Navigate to the corresponding route
    switch (newValue) {
      case 'feed':
        navigate('/feed');
        break;
      case 'search':
        navigate('/search');
        break;
      case 'create':
        navigate('/create');
        break;
      case 'notifications':
        navigate('/notifications');
        setNotificationCount(0); // Clear notifications when visiting the page
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/feed');
    }
  };

  // Don't show bottom nav on login/register pages or on desktop
  if (['/login', '/register'].includes(location.pathname) || !isMobile) {
    return null;
  }

  return (
    <Paper 
      elevation={8}
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderRadius: '24px 24px 0 0',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 -2px 15px rgba(0,0,0,0.3)'
          : '0 -2px 15px rgba(0,0,0,0.08)',
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.surfaceContainerLow
          : theme.palette.surfaceBright,
        mx: 1, // Small horizontal margin for better visual appearance
        mb: 0.5, // Small bottom margin for better visual appearance
        width: 'calc(100% - 16px)',
      }} 
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        sx={{
          height: 70,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 0 12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: theme.palette.text.secondary,
            opacity: 0.8,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            }
          },
          '& .Mui-selected': {
            color: `${theme.palette.primary.main} !important`,
            opacity: 1,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'font-size 0.2s, opacity 0.2s',
              opacity: 1,
            },
            '& .MuiSvgIcon-root': {
              transform: 'translateY(-4px)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            opacity: 0.7,
            fontSize: '0.70rem',
            transition: 'font-size 0.2s, opacity 0.2s',
            marginTop: '4px',
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="feed"
          icon={<HomeIcon />}
          sx={{ 
            '& .MuiSvgIcon-root': { 
              fontSize: 26,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            } 
          }}
        />
        <BottomNavigationAction
          label="Search"
          value="search"
          icon={<SearchIcon />}
          sx={{ 
            '& .MuiSvgIcon-root': { 
              fontSize: 26,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            } 
          }}
        />
        <BottomNavigationAction
          label="Create"
          value="create"
          icon={
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderRadius: '14px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
                },
                transform: value === 'create' ? 'translateY(-10px)' : 'none',
              }}
            >
              <AddIcon sx={{ fontSize: 24 }} />
            </Box>
          }
        />
        <BottomNavigationAction
          label="Alerts"
          value="notifications"
          icon={
            <Badge 
              badgeContent={notificationCount} 
              color="error" 
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: 16,
                  minWidth: 16,
                  padding: '0 4px',
                  borderRadius: 12,
                }
              }}
            >
              <NotificationsIcon />
            </Badge>
          }
          sx={{ 
            '& .MuiSvgIcon-root': { 
              fontSize: 26,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            } 
          }}
        />
        <BottomNavigationAction
          label="Profile"
          value="profile"
          icon={<PersonIcon />}
          sx={{ 
            '& .MuiSvgIcon-root': { 
              fontSize: 26,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            } 
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
