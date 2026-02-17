export interface Salon {
  id: string;
  name: string;
  slug: string;
  address: { street: string; city: string; zip: string; country: string };
  phone?: string;
  email?: string;
  openingHours?: Record<number, { open: string; close: string } | null>;
  allowGuestBooking: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  basePrice: number;
  category?: { id: string; name: string };
}

export interface SalonService {
  id: string;
  salonId: string;
  serviceId: string;
  service: Service;
  priceOverride?: number;
  durationOverride?: number;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  guestToken?: string;
  salon: Salon;
  staffMember: StaffMember;
  service: Service;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
