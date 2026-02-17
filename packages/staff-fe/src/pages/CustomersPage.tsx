import { useState } from 'react';
import {
  Box, Typography, TextField, Card, CardContent,
  CircularProgress, Alert, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { api } from '../api/client';

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isGuest: boolean;
}

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Customer[]>(`/customers/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Klientky</Typography>

      <TextField
        placeholder="Hledat dle jména, emailu nebo telefonu..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        fullWidth
        size="small"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress />}

      {results.map((c) => (
        <Card key={c.id} sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2">
                  {c.firstName} {c.lastName} {c.isGuest ? '(host)' : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.email} {c.phone ? `| ${c.phone}` : ''}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
