import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Spa as SpaIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { authenticated, login, logout, userName } = useAuth();

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar>
        <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'text.primary', fontWeight: 700 }}
        >
          Kosm
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {authenticated ? (
            <>
              <Button component={Link} to="/my-bookings" size="small">
                Moje rezervace
              </Button>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                {userName?.[0] || 'U'}
              </Avatar>
              <Button size="small" onClick={logout}>
                Odhlásit
              </Button>
            </>
          ) : (
            <Button variant="outlined" size="small" onClick={login}>
              Přihlásit se
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
