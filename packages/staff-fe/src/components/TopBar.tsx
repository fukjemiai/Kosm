import { AppBar, Toolbar, Typography, IconButton, Avatar, Box, Button } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export function TopBar() {
  const { userName, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {userName?.[0] || 'S'}
          </Avatar>
          <Typography variant="body2">{userName}</Typography>
          <IconButton size="small" onClick={logout} title="Odhlásit">
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
