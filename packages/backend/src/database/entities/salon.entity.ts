import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { SalonStaffAssignment } from './salon-staff-assignment.entity';
import { Booking } from './booking.entity';
import { SalonService } from './salon-service.entity';

@Entity('salons')
export class Salon extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.salons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'jsonb' })
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
    lat?: number;
    lng?: number;
  };

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  openingHours: {
    [dayOfWeek: number]: { open: string; close: string } | null;
  } | null;

  @Column({ name: 'booking_buffer_minutes', type: 'int', default: 0 })
  bookingBufferMinutes: number;

  @Column({ name: 'max_advance_booking_days', type: 'int', default: 60 })
  maxAdvanceBookingDays: number;

  @Column({ name: 'min_advance_booking_hours', type: 'int', default: 1 })
  minAdvanceBookingHours: number;

  @Column({ name: 'allow_guest_booking', default: true })
  allowGuestBooking: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => SalonStaffAssignment, (a) => a.salon)
  staffAssignments: SalonStaffAssignment[];

  @OneToMany(() => Booking, (b) => b.salon)
  bookings: Booking[];

  @OneToMany(() => SalonService, (ss) => ss.salon)
  salonServices: SalonService[];
}
