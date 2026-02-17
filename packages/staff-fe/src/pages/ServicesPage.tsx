import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  CircularProgress, Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useApiGet } from '../hooks/useApi';
import { api } from '../api/client';

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  basePrice: number;
  category?: { id: string; name: string };
  isActive: boolean;
}

export function ServicesPage() {
  const orgId = 'placeholder';
  const { data: services, loading, error, refetch } = useApiGet<Service[]>(`/services/by-org/${orgId}`);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 60, basePrice: 0 });
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async () => {
    setFormError(null);
    try {
      await api.post('/services', { ...form, organizationId: orgId });
      setOpen(false);
      setForm({ name: '', description: '', durationMinutes: 60, basePrice: 0 });
      refetch();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Služby</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>
          Nová služba
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress />}

      {services?.map((s) => (
        <Card key={s.id} sx={{ mb: 1 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">{s.name}</Typography>
                {s.category && <Chip label={s.category.name} size="small" variant="outlined" />}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {s.durationMinutes} min
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="primary">{s.basePrice} Kč</Typography>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nová služba</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField label="Název" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
          <TextField label="Popis" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth size="small" multiline rows={2} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Délka (min)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })} size="small" />
            <TextField label="Cena (Kč)" type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) })} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Zrušit</Button>
          <Button variant="contained" onClick={handleCreate}>Vytvořit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
