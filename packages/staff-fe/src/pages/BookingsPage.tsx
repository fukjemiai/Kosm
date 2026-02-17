import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  TextField, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { api } from '../api/client';

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

export function BookingsPage() {
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{ id: string; action: string } | null>(null);

  const salonId = 'placeholder';

  const loadBookings = () => {
    setLoading(true);
    api
      .get<Booking[]>(`/bookings/salon/${salonId}?from=${dateFrom}T00:00:00&to=${dateTo}T23:59:59`)
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, [dateFrom, dateTo]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.put(`/bookings/${id}/${action}`, {});
      setActionDialog(null);
      loadBookings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Rezervace</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Od"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Do"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress />}

      {bookings.map((b) => (
        <Card key={b.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{b.service.name}</Typography>
                <Typography variant="body2">
                  {new Date(b.startTime).toLocaleString('cs-CZ', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {' – '}
                  {new Date(b.endTime).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {b.customer?.firstName} {b.customer?.lastName}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={b.status.replace(/_/g, ' ')} size="small" sx={{ mb: 1 }} />
                <Typography variant="subtitle2" color="primary">{b.price} Kč</Typography>
              </Box>
            </Box>

            {b.status === 'CONFIRMED' && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="contained" color="success"
                  onClick={() => handleAction(b.id, 'complete')}>
                  Dokončit
                </Button>
                <Button size="small" variant="outlined" color="error"
                  onClick={() => setActionDialog({ id: b.id, action: 'no-show' })}>
                  No-show
                </Button>
                <Button size="small" color="error"
                  onClick={() => setActionDialog({ id: b.id, action: 'cancel-staff' })}>
                  Zrušit
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!actionDialog} onClose={() => setActionDialog(null)}>
        <DialogTitle>Potvrdit akci</DialogTitle>
        <DialogContent>
          <Typography>
            {actionDialog?.action === 'no-show'
              ? 'Opravdu chcete označit tuto rezervaci jako no-show?'
              : 'Opravdu chcete zrušit tuto rezervaci?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Ne</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => actionDialog && handleAction(actionDialog.id, actionDialog.action)}
          >
            Ano
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
