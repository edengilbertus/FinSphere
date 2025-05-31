import React from 'react';
import { Box, Toolbar, useTheme, useMediaQuery, Paper, Divider } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
// import Sidebar from './Sidebar'; // This will be created in a later step

const SIDEBAR_WIDTH = 280;

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Improved Sidebar component with modern styling
  const SidebarPlaceholder = () => (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: '100vh',
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.surfaceContainerLow 
          : theme.palette.surfaceBright,
        display: { xs: 'none', md: 'flex' }, // Show on md and up
        flexDirection: 'column',
        position: 'fixed', // Fixed sidebar
        left: 0,
        top: 0,
        zIndex: theme.zIndex.drawer + 1, // Ensure it's above some elements if needed
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      <Toolbar sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`,
        height: 72, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.surfaceContainer
          : theme.palette.surfaceBright,
      }}>
        <Box
          component="div"
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: theme.palette.primary.main,
            fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          FinSphere
        </Box>
      </Toolbar>
      <Box sx={{ 
        p: 2, 
        overflow: 'auto', 
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
      }}>
        {/* Sidebar menu items would go here */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark'
              ? theme.palette.surfaceContainer
              : theme.palette.surfaceContainerLow,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          Sidebar content coming soon
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.background
          : theme.palette.surfaceContainerLowest,
      }}
    >
      <SidebarPlaceholder /> {/* Replace with <Sidebar /> later */}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` }, // Adjust width for sidebar
          ml: { md: `${SIDEBAR_WIDTH}px` }, // Margin to offset fixed sidebar
          position: 'relative', // For potential children positioning
          height: '100vh',
        }}
      >
        <Navbar /> {/* Navbar at the top */}
        
        {/* Main content area with improved styling */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            overflowY: 'auto',
            // Add paddingBottom to ensure content isn't hidden by BottomNav on mobile
            pb: { xs: isMobile ? 10 : 3, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Outlet /> {/* Child routes (pages) will render here */}
        </Box>
        
        {isMobile && <BottomNav />} {/* Show BottomNav only on mobile */}
      </Box>
    </Box>
  );
};

export default MainLayout;
