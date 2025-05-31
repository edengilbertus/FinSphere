import React, { useState } from 'react';
import { Box, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const mockNotifications = [
  {
    id: 1,
    type: 'like',
    user: { name: 'Jane Doe', avatar: '' },
    message: 'liked your post',
    timestamp: '2m ago',
  },
  {
    id: 2,
    type: 'comment',
    user: { name: 'John Smith', avatar: '' },
    message: 'commented: "Great post!"',
    timestamp: '10m ago',
  },
  {
    id: 3,
    type: 'follow',
    user: { name: 'Alice', avatar: '' },
    message: 'started following you',
    timestamp: '1h ago',
  },
];

const iconMap = {
  like: <FavoriteIcon color="error" />,
  comment: <CommentIcon color="primary" />,
  follow: <PersonAddIcon color="success" />,
};

const Notifications = () => {
  const [notifications] = useState(mockNotifications);

  return (
    <Card sx={{ borderRadius: 4, mb: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #e0f2fe 100%)', boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsActiveIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
        </Box>
        <List>
          {notifications.map(n => (
            <ListItem key={n.id} sx={{ borderRadius: 3, mb: 1, background: 'rgba(255,255,255,0.7)' }}>
              <ListItemAvatar>
                <Avatar src={n.user.avatar}>{n.user.name[0]}</Avatar>
              </ListItemAvatar>
              {iconMap[n.type]}
              <ListItemText
                primary={<span><b>{n.user.name}</b> {n.message}</span>}
                secondary={n.timestamp}
                sx={{ ml: 2 }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default Notifications; 