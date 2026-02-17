import { Container, Typography, Box, Card, CardContent, CardActionArea, CircularProgress } from '@mui/material';
import { Spa as SpaIcon, LocationOn } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useApiGet } from '../hooks/useApi';
import type { Salon } from '../api/types';

export function HomePage() {
  // In a real app, this would be a public endpoint listing active salons
  // For MVP, we use a placeholder
  const { data: salons, loading } = useApiGet<Salon[]>('/salons/by-org/placeholder');

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <SpaIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          Kosm
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rezervujte si péči u nejlepších kosmetiček
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>Salony</Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Demo card – in production, map over salons */}
          <Card sx={{ mb: 2 }}>
            <CardActionArea component={Link} to="/booking/studio-centrum">
              <CardContent>
                <Typography variant="h6">Studio Centrum</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Vodičkova 12, Praha 1
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card>
            <CardActionArea component={Link} to="/booking/studio-vinohrady">
              <CardContent>
                <Typography variant="h6">Studio Vinohrady</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Mánesova 5, Praha 2
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      )}
    </Container>
  );
}
