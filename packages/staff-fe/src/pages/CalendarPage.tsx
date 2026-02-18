import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  TextField,
  CircularProgress, Alert,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: string;
  bookingNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  customer: { firstName?: string; lastName?: string; email?: string };
  service: { name: string };
  staffMember: { firstName: string; lastName: string };
}

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'default',
  CANCELLED_BY_CUSTOMER: 'error',
  CANCELLED_BY_STAFF: 'error',
  NO_SHOW: 'error',
};

export function CalendarPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { salonIds } = useAuth();
  const salonId = salonIds[0] || null;

  useEffect(() => {
    if (!salonId) return;
    setLoading(true);
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;
    api
      .get<Booking[]>(`/bookings/salon/${salonId}?from=${from}&to=${to}`)
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, salonId]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Denní přehled</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => changeDate(-1)}><ChevronLeft /></IconButton>
        <TextField
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
        />
        <IconButton onClick={() => changeDate(1)}><ChevronRight /></IconButton>
        <Typography variant="body2" color="text.secondary">
          {new Date(date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
      </Box>

      {!salonId && <Alert severity="warning" sx={{ mb: 2 }}>Nemáte přiřazený žádný salon.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : bookings.length === 0 ? (
        <Typography color="text.secondary">Na tento den nejsou žádné rezervace.</Typography>
      ) : (
        bookings.map((b) => (
          <Card key={b.id} sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2">
                    {new Date(b.startTime).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(b.endTime).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Chip
                    label={b.status.replace(/_/g, ' ')}
                    color={statusColors[b.status] || 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body1" fontWeight={600}>{b.service.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {b.customer?.firstName} {b.customer?.lastName} ({b.customer?.email || 'host'})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Specialistka: {b.staffMember.firstName} {b.staffMember.lastName}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle1" color="primary">{b.price} Kč</Typography>
                <Typography variant="caption">#{b.bookingNumber}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
