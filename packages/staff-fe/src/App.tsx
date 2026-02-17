import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar, CircularProgress } from '@mui/material';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CalendarPage } from './pages/CalendarPage';
import { BookingsPage } from './pages/BookingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ServicesPage } from './pages/ServicesPage';
import { BillingPage } from './pages/BillingPage';

function AppContent() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex' }}>
        <TopBar />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '240px' }}>
          <Toolbar />
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/billing" element={<BillingPage />} />
            {/* Placeholder routes */}
            <Route path="/reports" element={<Box>Reporty – připravujeme</Box>} />
            <Route path="/salons" element={<Box>Správa salonů – připravujeme</Box>} />
            <Route path="/staff" element={<Box>Správa zaměstnanců – připravujeme</Box>} />
            <Route path="/settings" element={<Box>Nastavení – připravujeme</Box>} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
