import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Salon } from './salon.entity';
import { Service } from './service.entity';

/** Služba nabízená v konkrétním salonu – může mít jiný price override */
@Entity('salon_services')
@Unique('UQ_salon_service', ['salonId', 'serviceId'])
export class SalonService extends BaseEntity {
  @Column({ name: 'salon_id', type: 'uuid' })
  salonId: string;

  @ManyToOne(() => Salon, (s) => s.salonServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (s) => s.salonServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'price_override', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride: number | null;

  @Column({ name: 'duration_override', type: 'int', nullable: true })
  durationOverride: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
