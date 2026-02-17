import { Card, CardContent, Typography, Button, Avatar, Box } from '@mui/material';
import type { StaffMember } from '../api/types';

interface Props {
  staff: StaffMember;
  onSelect: (staff: StaffMember) => void;
}

export function StaffCard({ staff, onSelect }: Props) {
  const initials = `${staff.firstName[0]}${staff.lastName[0]}`;

  return (
    <Card
      sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
      onClick={() => onSelect(staff)}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={staff.avatar || undefined}
          sx={{ width: 56, height: 56, bgcolor: 'secondary.main' }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {staff.firstName} {staff.lastName}
          </Typography>
          {staff.bio && (
            <Typography variant="body2" color="text.secondary">
              {staff.bio}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={() => onSelect(staff)}>
          Vybrat
        </Button>
      </CardContent>
    </Card>
  );
}
