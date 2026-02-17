import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Booking } from './booking.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  /** Null for guest customers */
  @Column({ name: 'keycloak_id', type: 'varchar', length: 255, nullable: true, unique: true })
  keycloakId: string | null;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'is_guest', default: false })
  isGuest: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'gdpr_consent_at', type: 'timestamptz', nullable: true })
  gdprConsentAt: Date | null;

  @Column({ name: 'data_retention_until', type: 'timestamptz', nullable: true })
  dataRetentionUntil: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Booking, (b) => b.customer)
  bookings: Booking[];
}
