import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  Fab,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Add,
  Savings,
  Chat,
  Group,
  Notifications,
  AttachMoney,
  CreditCard,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [dashboardData, setDashboardData] = useState({
    balance: 2450.75,
    monthlyChange: 12.5,
    savingsGoals: [],
    recentTransactions: [],
    friendRequests: 3,
    unreadMessages: 7,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if user is not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Simulate API calls - replace with actual API calls
        setLoading(false);
        // const [savings, profile] = await Promise.all([
        //   apiService.getSavingsGoals(),
        //   apiService.getProfile()
        // ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  // Mock data for demonstration
  const savingsGoals = [
    { id: 1, title: 'Emergency Fund', current: 3200, target: 5000, color: '#4CAF50' },
    { id: 2, title: 'Vacation', current: 1250, target: 3000, color: '#2196F3' },
    { id: 3, title: 'New Car', current: 8500, target: 25000, color: '#FF9800' },
  ];

  const recentTransactions = [
    { id: 1, title: 'Salary Deposit', amount: 3500, type: 'credit', date: '2025-05-29' },
    { id: 2, title: 'Grocery Shopping', amount: -127.50, type: 'debit', date: '2025-05-28' },
    { id: 3, title: 'Netflix Subscription', amount: -15.99, type: 'debit', date: '2025-05-27' },
    { id: 4, title: 'Freelance Payment', amount: 850, type: 'credit', date: '2025-05-26' },
  ];

  const quickActions = [
    { label: 'Send Money', icon: <AttachMoney />, action: () => navigate('/transfer') },
    { label: 'Pay Bills', icon: <CreditCard />, action: () => navigate('/bills') },
    { label: 'Investment', icon: <Timeline />, action: () => navigate('/invest') },
    { label: 'Savings', icon: <Savings />, action: () => navigate('/savings') },
  ];

  // If not logged in, render nothing (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%)',
      pt: 3,
      pb: 10,
    }}>
      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            boxShadow: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user.profile?.profilePictureUrl}
              sx={{
                width: 72,
                height: 72,
                border: `4px solid #6750A4`,
                boxShadow: 2,
                fontSize: 32,
              }}
            >
              {user.profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Welcome back, {user.profile?.firstName || 'User'}! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Here's what's happening with your finances today
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" color="text.secondary">
                Total Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${dashboardData.balance.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                {dashboardData.monthlyChange >= 0 ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: dashboardData.monthlyChange >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {dashboardData.monthlyChange >= 0 ? '+' : ''}{dashboardData.monthlyChange}% this month
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #f6edff 0%, #e0f2fe 100%)',
            boxShadow: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={action.action}
                  sx={{
                    py: 2.5,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #eaddff 0%, #b69df8 100%)',
                    color: '#4F378B',
                    fontWeight: 700,
                    fontSize: 18,
                    boxShadow: '0 2px 8px rgba(103,80,164,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b69df8 0%, #eaddff 100%)',
                      transform: 'translateY(-2px) scale(1.03)',
                      boxShadow: '0 6px 24px rgba(103,80,164,0.12)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {React.cloneElement(action.icon, {
                    sx: { fontSize: 36, mb: 1, color: '#6750A4' }
                  })}
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {action.label}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Savings Goals */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                borderRadius: 6,
                background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
                boxShadow: 2,
                border: 'none',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Savings Goals
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/savings/new')}
                    sx={{ borderRadius: 3 }}
                  >
                    Add Goal
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {savingsGoals.map((goal) => (
                    <Grid item xs={12} sm={6} lg={4} key={goal.id}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 4,
                          background: 'linear-gradient(135deg, #e0f2fe 0%, #eaddff 100%)',
                          border: `2px solid ${goal.color}40`,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: 1,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: goal.color,
                          }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                          {goal.title}
                        </Typography>
                        <Typography variant="h6" sx={{ color: goal.color, mb: 1 }}>
                          ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (goal.current / goal.target) * 100)}
                          sx={{ height: 8, borderRadius: 4, background: '#eaddff', '& .MuiLinearProgress-bar': { background: goal.color } }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Notifications & Messages */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              {/* Recent Activity */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #f6edff 0%, #e0f2fe 100%)',
                    boxShadow: 2,
                    border: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Recent Transactions
                    </Typography>
                    {recentTransactions.map((transaction) => (
                      <Box
                        key={transaction.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          borderBottom: `1px solid #eaddff`,
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {transaction.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {transaction.date}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: transaction.type === 'credit' ? 'success.main' : 'error.main',
                            fontWeight: 700,
                          }}
                        >
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
                    boxShadow: 2,
                    border: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Quick Stats
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #f6edff 0%, #e0f2fe 100%)',
                        }}
                      >
                        <Chat sx={{ color: 'primary.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">Messages</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {dashboardData.unreadMessages}
                          </Typography>
                        </Box>
                        <Chip label="New" size="small" color="primary" />
                      </Box>
                      
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #eaddff 0%, #f3e5f5 100%)',
                        }}
                      >
                        <Group sx={{ color: 'secondary.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">Friend Requests</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {dashboardData.friendRequests}
                          </Typography>
                        </Box>
                        <Chip label="Pending" size="small" color="secondary" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            boxShadow: '0 8px 32px rgba(76, 158, 235, 0.3)',
          }}
          onClick={() => navigate('/chat')}
        >
          <Chat />
        </Fab>
      </Container>
    </Box>
  );
};

export default DashboardPage;
