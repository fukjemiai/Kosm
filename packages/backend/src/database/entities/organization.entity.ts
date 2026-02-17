import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Salon } from './salon.entity';
import { StaffMember } from './staff-member.entity';
import { Currency } from '../../common/enums';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'owner_keycloak_id', type: 'varchar', length: 255 })
  ownerKeycloakId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ico: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dic: string | null;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  } | null;

  @Column({
    name: 'default_currency',
    type: 'enum',
    enum: Currency,
    default: Currency.CZK,
  })
  defaultCurrency: Currency;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 21.0 })
  vatRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Salon, (salon) => salon.organization)
  salons: Salon[];

  @OneToMany(() => StaffMember, (staff) => staff.organization)
  staffMembers: StaffMember[];
}
