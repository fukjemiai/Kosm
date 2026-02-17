import { useState } from 'react';
import {
  Container, Typography, Card, CardContent, Button, Box,
  Chip, CircularProgress, Alert, Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useApiGet, useApiMutation } from '../hooks/useApi';
import type { Booking, PaginatedResult } from '../api/types';

const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  PENDING: { label: 'Čeká', color: 'warning' },
  CONFIRMED: { label: 'Potvrzeno', color: 'success' },
  IN_PROGRESS: { label: 'Probíhá', color: 'info' },
  COMPLETED: { label: 'Dokončeno', color: 'default' },
  CANCELLED_BY_CUSTOMER: { label: 'Zrušeno', color: 'error' },
  CANCELLED_BY_STAFF: { label: 'Zrušeno salonem', color: 'error' },
  NO_SHOW: { label: 'Nedostavení', color: 'error' },
  RESCHEDULED: { label: 'Přebookováno', color: 'info' },
};

export function MyBookingsPage() {
  const { authenticated } = useAuth();
  const { data, loading, error } = useApiGet<PaginatedResult<Booking>>(
    authenticated ? '/bookings/my?limit=50' : null,
  );
  const { mutate } = useApiMutation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await mutate('put', `/bookings/${id}/cancel`, {});
      window.location.reload();
    } finally {
      setCancellingId(null);
    }
  };

  if (!authenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Pro zobrazení rezervací se prosím přihlaste.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const bookings = data?.data || [];

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Moje rezervace</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {bookings.length === 0 ? (
        <Typography color="text.secondary">Zatím nemáte žádné rezervace.</Typography>
      ) : (
        bookings.map((b) => {
          const status = statusMap[b.status] || { label: b.status, color: 'default' as const };
          const isCancellable = ['PENDING', 'CONFIRMED'].includes(b.status);

          return (
            <Card key={b.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {b.service?.name}
                  </Typography>
                  <Chip label={status.label} color={status.color} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(b.startTime).toLocaleString('cs-CZ', {
                    weekday: 'short', day: 'numeric', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {b.staffMember?.firstName} {b.staffMember?.lastName} | {b.salon?.name}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="primary">{b.price} Kč</Typography>
                  {isCancellable && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                    >
                      Zrušit
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}
    </Container>
  );
}
