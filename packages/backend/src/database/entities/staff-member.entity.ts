import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { SalonStaffAssignment } from './salon-staff-assignment.entity';
import { Shift } from './shift.entity';
import { Booking } from './booking.entity';

@Entity('staff_members')
export class StaffMember extends BaseEntity {
  @Column({ name: 'keycloak_id', type: 'varchar', length: 255, unique: true })
  keycloakId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.staffMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => SalonStaffAssignment, (a) => a.staffMember)
  salonAssignments: SalonStaffAssignment[];

  @OneToMany(() => Shift, (s) => s.staffMember)
  shifts: Shift[];

  @OneToMany(() => Booking, (b) => b.staffMember)
  bookings: Booking[];
}
