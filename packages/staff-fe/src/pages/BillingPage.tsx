import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Alert,
  CircularProgress, Chip, Divider,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useApiGet } from '../hooks/useApi';
import { api } from '../api/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  issuedAt: string;
  paidAt?: string;
  customerSnapshot: { name: string; email?: string };
  payments: Array<{ amount: number; method: string; paidAt: string }>;
}

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  DRAFT: 'default',
  ISSUED: 'warning',
  PAID: 'success',
  PARTIALLY_PAID: 'info',
  CANCELLED: 'error',
  REFUNDED: 'error',
};

export function BillingPage() {
  const orgId = 'placeholder';
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: invoices, loading, error, refetch } = useApiGet<Invoice[]>(
    `/billing/invoices/by-org/${orgId}?from=${from}&to=${to}`,
    [from, to],
  );

  const [payDialog, setPayDialog] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payError, setPayError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!payDialog) return;
    setPayError(null);
    try {
      await api.post('/billing/payments', {
        invoiceId: payDialog.id,
        amount: parseFloat(payAmount),
        method: payMethod,
      });
      setPayDialog(null);
      setPayAmount('');
      refetch();
    } catch (err: any) {
      setPayError(err.message);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    window.open(`/api/v1/billing/export/${orgId}?from=${from}&to=${to}&format=${format}`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Billing</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<Download />} onClick={() => handleExport('csv')}>
            CSV
          </Button>
          <Button size="small" startIcon={<Download />} onClick={() => handleExport('xlsx')}>
            XLSX
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField label="Od" type="date" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="Do" type="date" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress />}

      {invoices?.map((inv) => (
        <Card key={inv.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {inv.invoiceNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {inv.customerSnapshot.name} | {new Date(inv.issuedAt).toLocaleDateString('cs-CZ')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={inv.status} color={statusColors[inv.status] || 'default'} size="small" />
                <Typography variant="h6" color="primary">{inv.total} {inv.currency}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Základ: {inv.subtotal} | DPH {inv.vatRate}%: {inv.vatAmount}
              </Typography>
              {['ISSUED', 'PARTIALLY_PAID'].includes(inv.status) && (
                <Button size="small" variant="contained" onClick={() => { setPayDialog(inv); setPayAmount(String(inv.total - inv.payments.reduce((s, p) => s + Number(p.amount), 0))); }}>
                  Zaplatit
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!payDialog} onClose={() => setPayDialog(null)}>
        <DialogTitle>Zaznamenat platbu</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, minWidth: 300 }}>
          {payError && <Alert severity="error">{payError}</Alert>}
          <TextField label="Částka" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} size="small" fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Způsob platby</InputLabel>
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} label="Způsob platby">
              <MenuItem value="CASH">Hotově</MenuItem>
              <MenuItem value="CARD_TERMINAL">Kartou (terminál)</MenuItem>
              <MenuItem value="BANK_TRANSFER">Převodem</MenuItem>
              <MenuItem value="ONLINE_GATEWAY">Online</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(null)}>Zrušit</Button>
          <Button variant="contained" onClick={handlePayment}>Zaznamenat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
