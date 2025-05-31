import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'; // Added Navigate
import { AuthProvider, useAuth } from './context/AuthContext'; // Added useAuth
import { AppThemeProvider } from './context/ThemeContext';
import { Box, CircularProgress, Container, Typography, CssBaseline, Paper, alpha, useTheme } from '@mui/material';

// Lazy load components to prevent any initial rendering issues
const DebugInfo = React.lazy(() => import('./components/DebugInfo')); // Navbar & BottomNav are now in MainLayout
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const FeedPage = React.lazy(() => import('./pages/FeedPage'));

// Enhanced loading fallback with Material You styling
const LoadingFallback = () => {
  const theme = useTheme();
  
  return (
    <Container maxWidth="sm" sx={{ 
      mt: 8, 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh'
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 4,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.surfaceContainerLow, 0.8)
            : alpha(theme.palette.surfaceBright, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <CircularProgress 
            size={50} 
            thickness={4} 
            sx={{ color: theme.palette.primary.main }} 
          />
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            mb: 1.5,
            color: theme.palette.text.primary 
          }}
        >
          Loading FinSphere
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: 300
          }}
        >
          Preparing your personalized financial experience...
        </Typography>
      </Paper>
    </Container>
  );
};

// Protected Element Wrapper - new pattern
const ProtectedElement = ({ element: PageComponent, ...rest }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageComponent {...rest} />
    </Suspense>
  );
};

const MainLayout = React.lazy(() => import('./components/MainLayout')); // Import MainLayout

// Component to handle layout and conditional rendering of Nav/Debug
const AppContent = () => {
  const location = useLocation();
  const theme = useTheme();
  const authPaths = ['/login', '/register'];
  // DebugInfo visibility logic (Navbar and BottomNav are now part of MainLayout)
  const showDebugInfoOnNonAuthPage = !authPaths.includes(location.pathname);
  const showDebugInfo = showDebugInfoOnNonAuthPage && process.env.NODE_ENV === 'development';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' 
        ? theme.palette.background
        : theme.palette.surfaceContainerLowest,
      transition: 'background-color 0.3s ease'
    }}>
      {/* DebugInfo can be here if it's truly global, or inside MainLayout if only for authenticated */}
      {showDebugInfo && (
        <Suspense fallback={<Box sx={{ height: 'auto', minHeight: '50px' }} />}>
          <DebugInfo />
        </Suspense>
      )}
      
      {/* Routes will handle rendering MainLayout or standalone pages */}
      <Routes>
        {/* Standalone routes (no MainLayout) */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingFallback />}>
            <RegisterPage />
          </Suspense>
        } />

        {/* Protected routes using MainLayout */}
        <Route element={<ProtectedElement element={MainLayout} />}>
          <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<LoadingFallback />}><ChatPage /></Suspense>} />
          <Route path="/feed" element={<Suspense fallback={<LoadingFallback />}><FeedPage /></Suspense>} />
          <Route path="/search" element={
            <Suspense fallback={<LoadingFallback />}>
              <Paper 
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Search Page
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Search functionality coming soon
                </Typography>
              </Paper>
            </Suspense>
          } />
          <Route path="/create" element={
            <Suspense fallback={<LoadingFallback />}>
              <Paper 
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Create Post
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create post page coming soon
                </Typography>
              </Paper>
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<LoadingFallback />}>
              <Paper 
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Notifications
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Notifications page coming soon
                </Typography>
              </Paper>
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<LoadingFallback />}>
              <Paper 
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Profile
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Profile page coming soon
                </Typography>
              </Paper>
            </Suspense>
          } />
          {/* Default authenticated route */}
          <Route index element={<Suspense fallback={<LoadingFallback />}><FeedPage /></Suspense>} /> 
          {/* Note: path="/" for authenticated section defaults to FeedPage. 
              If you need a separate unauthenticated homepage, that needs a different setup.
              The current ProtectedElement on path="/" will redirect to /login if not authenticated.
          */}
        </Route>
      </Routes>
    </Box>
  );
};

const App = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </AppThemeProvider>
    </Suspense>
  );
};

export default App;
