import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Alert, Card, CardContent,
  TextField, Divider, CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingStepper } from '../components/BookingStepper';
import { ServiceCard } from '../components/ServiceCard';
import { StaffCard } from '../components/StaffCard';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { GuestForm, GuestData } from '../components/GuestForm';
import { useAuth } from '../context/AuthContext';
import { useApiGet, useApiMutation } from '../hooks/useApi';
import type { SalonService, StaffMember, TimeSlot, Salon, Booking } from '../api/types';

export function BookingPage() {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  const { authenticated } = useAuth();

  // ── State ──────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerNote, setCustomerNote] = useState('');
  const [guestData, setGuestData] = useState<GuestData>({ email: '', phone: '', firstName: '', lastName: '' });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── API Calls ──────────────────────────────────────
  const { data: salon } = useApiGet<Salon>(salonSlug ? `/salons/slug/${salonSlug}` : null);
  const { data: services, loading: servicesLoading } = useApiGet<SalonService[]>(
    salon ? `/services/by-salon/${salon.id}` : null,
    [salon?.id],
  );
  const { data: staffList, loading: staffLoading } = useApiGet<StaffMember[]>(
    salon ? `/staff/by-salon/${salon.id}` : null,
    [salon?.id],
  );

  // Time slots
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate || !selectedStaff || !selectedService || !salon) return;
    setSlotsLoading(true);
    const params = new URLSearchParams({
      staffMemberId: selectedStaff.id,
      salonId: salon.id,
      date: selectedDate,
      serviceId: selectedService.serviceId,
    });
    fetch(`/api/v1/availability/slots?${params}`)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedStaff, selectedService, salon]);

  const { mutate, loading: submitting } = useApiMutation();

  // ── Handlers ──────────────────────────────────────
  const handleSubmit = async () => {
    if (!salon || !selectedService || !selectedStaff || !selectedSlot) return;
    setSubmitError(null);

    try {
      const baseBody = {
        salonId: salon.id,
        staffMemberId: selectedStaff.id,
        serviceId: selectedService.serviceId,
        startTime: selectedSlot.start,
        customerNote: customerNote || undefined,
      };

      let result: Booking;

      if (authenticated) {
        result = await mutate('post', '/bookings', baseBody) as Booking;
      } else {
        result = await mutate('post', '/bookings/guest', {
          ...baseBody,
          guestEmail: guestData.email,
          guestPhone: guestData.phone || undefined,
          guestFirstName: guestData.firstName || undefined,
          guestLastName: guestData.lastName || undefined,
        }) as Booking;
      }

      navigate(`/booking/confirmation/${result.bookingNumber}`, { state: { booking: result } });
    } catch (err: any) {
      setSubmitError(err.message || 'Chyba při vytváření rezervace');
    }
  };

  // ── Today + 1 as min date ─────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  if (!salon) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        {salon.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {salon.address.street}, {salon.address.city}
      </Typography>

      <BookingStepper activeStep={step} />

      {/* Step 0: Výběr služby */}
      {step === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Vyberte službu</Typography>
          {servicesLoading ? (
            <CircularProgress />
          ) : (
            services?.map((ss) => (
              <ServiceCard
                key={ss.id}
                salonService={ss}
                onSelect={(s) => { setSelectedService(s); setStep(1); }}
              />
            ))
          )}
        </Box>
      )}

      {/* Step 1: Výběr specialistky */}
      {step === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Vyberte specialistku</Typography>
          {staffLoading ? (
            <CircularProgress />
          ) : (
            staffList?.map((s) => (
              <StaffCard
                key={s.id}
                staff={s}
                onSelect={(staff) => { setSelectedStaff(staff); setStep(2); }}
              />
            ))
          )}
          <Button onClick={() => setStep(0)} sx={{ mt: 2 }}>Zpět</Button>
        </Box>
      )}

      {/* Step 2: Výběr data a času */}
      {step === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Vyberte termín</Typography>
          <TextField
            label="Datum"
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
            inputProps={{ min: minDate }}
            fullWidth
            sx={{ mb: 3 }}
            InputLabelProps={{ shrink: true }}
          />

          {selectedDate && (
            <TimeSlotPicker
              slots={slots}
              loading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelect={(slot) => setSelectedSlot(slot)}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={() => setStep(1)}>Zpět</Button>
            <Button
              variant="contained"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Pokračovat
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Shrnutí + potvrzení */}
      {step === 3 && selectedService && selectedStaff && selectedSlot && (
        <Box>
          <Typography variant="h6" gutterBottom>Shrnutí rezervace</Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>{selectedService.service.name}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                Specialistka: {selectedStaff.firstName} {selectedStaff.lastName}
              </Typography>
              <Typography variant="body2">
                Termín: {new Date(selectedSlot.start).toLocaleString('cs-CZ', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
              <Typography variant="body2">
                Délka: {selectedService.durationOverride ?? selectedService.service.durationMinutes} min
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" color="primary">
                Cena: {selectedService.priceOverride ?? selectedService.service.basePrice} Kč
              </Typography>
            </CardContent>
          </Card>

          <TextField
            label="Poznámka (volitelné)"
            multiline
            rows={2}
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 3 }}
          />

          {!authenticated && (
            <Box sx={{ mb: 3 }}>
              <GuestForm value={guestData} onChange={setGuestData} />
            </Box>
          )}

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setStep(2)}>Zpět</Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting || (!authenticated && !guestData.email)}
            >
              {submitting ? 'Odesílám...' : 'Potvrdit rezervaci'}
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}
