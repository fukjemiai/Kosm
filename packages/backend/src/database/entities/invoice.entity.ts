import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Salon } from './salon.entity';
import { Booking } from './booking.entity';
import { Payment } from './payment.entity';
import { InvoiceStatus, Currency } from '../../common/enums';

@Entity('invoices')
@Index('IDX_invoice_org_date', ['organizationId', 'issuedAt'])
export class Invoice extends BaseEntity {
  @Column({ name: 'invoice_number', type: 'varchar', length: 30, unique: true })
  invoiceNumber: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'salon_id', type: 'uuid' })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @Column({ name: 'booking_id', type: 'uuid', unique: true })
  bookingId: string;

  @OneToOne(() => Booking, (b) => b.invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2 })
  vatRate: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 10, scale: 2 })
  vatAmount: number;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.CZK })
  currency: Currency;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt: Date | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  /** Structured line items (service name, qty, unit price, total) */
  @Column({ name: 'line_items', type: 'jsonb' })
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  @Column({ name: 'customer_snapshot', type: 'jsonb' })
  customerSnapshot: {
    name: string;
    email?: string;
    phone?: string;
  };

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];
}
