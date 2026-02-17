import { Box, Button, Typography, CircularProgress } from '@mui/material';
import type { TimeSlot } from '../api/types';

interface Props {
  slots: TimeSlot[];
  loading: boolean;
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotPicker({ slots, loading, selectedSlot, onSelect }: Props) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (slots.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        Pro tento den nejsou dostupné žádné termíny.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {slots.map((slot) => {
        const time = new Date(slot.start).toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const isSelected = selectedSlot?.start === slot.start;

        return (
          <Button
            key={slot.start}
            variant={isSelected ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onSelect(slot)}
            sx={{ minWidth: 80 }}
          >
            {time}
          </Button>
        );
      })}
    </Box>
  );
}
