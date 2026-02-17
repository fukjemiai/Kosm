import { Card, CardContent, Typography, Button, Box, Chip } from '@mui/material';
import { AccessTime, CurrencyExchange } from '@mui/icons-material';
import type { SalonService } from '../api/types';

interface Props {
  salonService: SalonService;
  onSelect: (salonService: SalonService) => void;
}

export function ServiceCard({ salonService, onSelect }: Props) {
  const { service, priceOverride, durationOverride } = salonService;
  const price = priceOverride ?? service.basePrice;
  const duration = durationOverride ?? service.durationMinutes;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            {service.category && (
              <Chip label={service.category.name} size="small" sx={{ mb: 0.5 }} />
            )}
            <Typography variant="h6">{service.name}</Typography>
            {service.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {service.description}
              </Typography>
            )}
          </Box>
          <Typography variant="h6" color="primary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
            {price} Kč
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {duration} min
            </Typography>
          </Box>
          <Button variant="contained" size="small" onClick={() => onSelect(salonService)}>
            Vybrat
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
