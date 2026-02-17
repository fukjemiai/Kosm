import { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Alert, CircularProgress, Box, Divider } from '@mui/material';
import { useParams } from 'react-router-dom';
import type { Booking } from '../api/types';

export function GuestBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/bookings/guest/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Neplatný odkaz');
        return r.json();
      })
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/v1/bookings/guest/${token}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Zrušeno zákazníkem přes guest odkaz' }),
      });
      if (!res.ok) throw new Error('Nepodařilo se zrušit');
      setCancelled(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!booking) return null;

  const isCancellable = ['PENDING', 'CONFIRMED'].includes(booking.status) && !cancelled;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Vaše rezervace</Typography>

      {cancelled && <Alert severity="success" sx={{ mb: 2 }}>Rezervace byla úspěšně zrušena.</Alert>}

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600}>
            {booking.service?.name}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            Číslo: {booking.bookingNumber}
          </Typography>
          <Typography variant="body2">
            Termín: {new Date(booking.startTime).toLocaleString('cs-CZ', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Typography>
          <Typography variant="body2">
            Specialistka: {booking.staffMember?.firstName} {booking.staffMember?.lastName}
          </Typography>
          <Typography variant="body2">
            Salon: {booking.salon?.name}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" color="primary">{booking.price} Kč</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Stav: {cancelled ? 'Zrušeno' : booking.status}
          </Typography>
        </CardContent>
      </Card>

      {isCancellable && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Ruším...' : 'Zrušit rezervaci'}
          </Button>
        </Box>
      )}
    </Container>
  );
}
