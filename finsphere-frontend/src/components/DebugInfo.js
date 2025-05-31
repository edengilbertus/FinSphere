import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      nodeEnv: process.env.NODE_ENV,
      apiUrl: process.env.REACT_APP_API_URL,
      socketUrl: process.env.REACT_APP_SOCKET_URL,
      firebaseConfig: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '***SET***' : 'NOT SET',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '***SET***' : 'NOT SET',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '***SET***' : 'NOT SET',
      },
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          FinSphere Debug Information
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          This debug component helps identify configuration issues.
        </Alert>

        <Typography variant="body2" component="pre" sx={{ fontSize: '12px' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default DebugInfo;
