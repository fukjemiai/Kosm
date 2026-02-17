import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Box,
} from '@mui/material';
import {
  CalendarMonth, People, ContentCut, Receipt, Assessment,
  Settings, Store, Spa,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: 'Kalendář', icon: <CalendarMonth />, path: '/calendar' },
  { label: 'Rezervace', icon: <CalendarMonth />, path: '/bookings' },
  { label: 'Klientky', icon: <People />, path: '/customers' },
  { label: 'Služby', icon: <ContentCut />, path: '/services' },
  { label: 'Billing', icon: <Receipt />, path: '/billing' },
  { label: 'Reporty', icon: <Assessment />, path: '/reports' },
];

const adminItems = [
  { label: 'Salony', icon: <Store />, path: '/salons' },
  { label: 'Zaměstnanci', icon: <People />, path: '/staff' },
  { label: 'Nastavení', icon: <Settings />, path: '/settings' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Spa sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700}>Kosm Staff</Typography>
      </Toolbar>
      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">Správa</Typography>
      </Box>
      <List>
        {adminItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
