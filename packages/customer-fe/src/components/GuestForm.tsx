import { useState } from 'react';
import { TextField, Box, Typography } from '@mui/material';

export interface GuestData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

interface Props {
  value: GuestData;
  onChange: (data: GuestData) => void;
}

export function GuestForm({ value, onChange }: Props) {
  const update = (field: keyof GuestData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Vyplňte kontaktní údaje pro guest rezervaci
      </Typography>
      <TextField
        label="E-mail *"
        type="email"
        value={value.email}
        onChange={(e) => update('email', e.target.value)}
        required
        fullWidth
        size="small"
      />
      <TextField
        label="Telefon"
        type="tel"
        value={value.phone}
        onChange={(e) => update('phone', e.target.value)}
        fullWidth
        size="small"
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Jméno"
          value={value.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Příjmení"
          value={value.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          fullWidth
          size="small"
        />
      </Box>
    </Box>
  );
}
