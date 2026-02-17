import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Salon } from './salon.entity';
import { StaffMember } from './staff-member.entity';
import { Service } from './service.entity';
import { Customer } from './customer.entity';
import { Invoice } from './invoice.entity';
import { BookingStatus } from '../../common/enums';

@Entity('bookings')
@Index('IDX_booking_salon_staff_time', ['salonId', 'staffMemberId', 'startTime', 'endTime'])
@Index('IDX_booking_customer', ['customerId'])
@Index('IDX_booking_date', ['startTime'])
@Check('"end_time" > "start_time"')
export class Booking extends BaseEntity {
  @Column({ name: 'booking_number', type: 'varchar', length: 20, unique: true })
  bookingNumber: string;

  @Column({ name: 'salon_id', type: 'uuid' })
  salonId: string;

  @ManyToOne(() => Salon, (s) => s.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @Column({ name: 'staff_member_id', type: 'uuid' })
  staffMemberId: string;

  @ManyToOne(() => StaffMember, (sm) => sm.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (c) => c.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ name: 'buffer_before_minutes', type: 'int', default: 0 })
  bufferBeforeMinutes: number;

  @Column({ name: 'buffer_after_minutes', type: 'int', default: 0 })
  bufferAfterMinutes: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote: string | null;

  /** Token for guest booking management (cancel/reschedule) */
  @Column({ name: 'guest_token', type: 'varchar', length: 255, nullable: true })
  guestToken: string | null;

  @Column({ name: 'guest_token_expires_at', type: 'timestamptz', nullable: true })
  guestTokenExpiresAt: Date | null;

  /** Reference to replacement booking if rescheduled */
  @Column({ name: 'rescheduled_to_id', type: 'uuid', nullable: true })
  rescheduledToId: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @OneToOne(() => Invoice, (inv) => inv.booking, { nullable: true })
  invoice: Invoice | null;
}
