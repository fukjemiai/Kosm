import { Container, Typography, Card, CardContent, Box, Button, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useLocation, Link } from 'react-router-dom';
import type { Booking } from '../api/types';

export function ConfirmationPage() {
  const location = useLocation();
  const booking = location.state?.booking as Booking | undefined;

  if (!booking) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Žádná rezervace k zobrazení.</Alert>
        <Button component={Link} to="/" sx={{ mt: 2 }}>Zpět na hlavní stránku</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 1 }} />
        <Typography variant="h5" gutterBottom>Rezervace vytvořena!</Typography>
        <Typography variant="body2" color="text.secondary">
          Číslo rezervace: <strong>{booking.bookingNumber}</strong>
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600}>{booking.service?.name}</Typography>
          <Typography variant="body2">
            {new Date(booking.startTime).toLocaleString('cs-CZ', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Typography>
          <Typography variant="body2">
            {booking.staffMember?.firstName} {booking.staffMember?.lastName}
          </Typography>
          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
            {booking.price} Kč
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Stav: {booking.status === 'CONFIRMED' ? 'Potvrzeno' : 'Čeká na potvrzení'}
          </Typography>
        </CardContent>
      </Card>

      {booking.guestToken && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Na váš e-mail jsme odeslali odkaz pro správu rezervace.
          Přes tento odkaz můžete rezervaci zobrazit nebo zrušit.
        </Alert>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button component={Link} to="/" variant="outlined">
          Zpět na hlavní stránku
        </Button>
      </Box>
    </Container>
  );
}
