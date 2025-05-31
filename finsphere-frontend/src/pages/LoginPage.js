import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  Link,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  // AccountBalance, // We'll replace this with text
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Effect to handle navigation after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signIn(formData.email, formData.password);
      setIsAuthenticated(true);
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      setIsAuthenticated(true);
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={(theme) => ({ // Use theme callback to access theme
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Remove old gradient
        backgroundColor: theme.palette.background.default, // Use theme background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      })}
    >
      <Container maxWidth="sm">
        {/* Paper will now inherit styles from MuiPaper/MuiCard theme overrides */}
        {/* We can remove explicit background, borderRadius, backdropFilter if theme handles it */}
        <Paper
          elevation={3} // Adjust elevation as per M3 style, or let theme default handle
          sx={{
            // borderRadius: 4, // Will be overridden by theme's shape.borderRadius (16px) or MuiPaper override
            overflow: 'hidden', // Keep overflow hidden
            // background: 'rgba(255, 255, 255, 0.95)', // Remove, use theme.palette.background.paper (surfaceContainer)
            // backdropFilter: 'blur(10px)', // Remove, M3 cards are typically opaque
          }}
        >
          {/* Header */}
          <Box
            sx={(theme) => ({
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              padding: 4,
              textAlign: 'center',
            })}
          >
            <Box
              component="img"
              src="/assets/logo.png"
              alt="FinSphere Logo"
              sx={{
                height: 50, // Adjust height as needed
                mb: 2,
              }}
            />
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{mb: 2}}>
              Welcome Back!
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Sign in to continue to your financial hub.
            </Typography>
          </Box>

          <CardContent sx={{ padding: 4 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                disabled={loading}
                sx={{ mb: 2 }} // borderRadius will come from theme MuiTextField override
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                disabled={loading}
                sx={{ mb: 3 }} // borderRadius will come from theme MuiTextField override
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 3,
                  height: 56, // Keep height if desired
                  // borderRadius: 3, // Will be handled by MuiButton theme override (pill shape)
                  // background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)', // Use theme button color
                  fontSize: '1rem', // Adjusted for M3 feel
                  // fontWeight: 600, // Theme will set this (500)
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined" // Outlined buttons will pick up theme styles
                size="large"
                onClick={handleGoogleSignIn}
                disabled={loading}
                startIcon={<GoogleIcon />}
                sx={{
                  mb: 3,
                  height: 56, // Keep height
                  // borderRadius: 3, // Theme override
                  // borderColor: '#1976d2', // Theme override
                  // color: '#1976d2', // Theme override
                  fontSize: '1rem', // Adjusted
                  // fontWeight: 500, // Theme override
                  // '&:hover': { // Theme override
                  //   borderColor: '#1565c0',
                  //   backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  // },
                }}
              >
                Continue with Google
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={(theme) => ({ // Use theme for link color
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    })}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          sx={{
            textAlign: 'center',
            mt: 3,
            opacity: 0.8,
          }}
        >
          © 2025 FinSphere. Secure financial social platform.
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
