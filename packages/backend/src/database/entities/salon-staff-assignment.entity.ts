import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Salon } from './salon.entity';
import { StaffMember } from './staff-member.entity';
import { StaffRole } from '../../common/enums';

@Entity('salon_staff_assignments')
@Unique('UQ_salon_staff', ['salonId', 'staffMemberId'])
export class SalonStaffAssignment extends BaseEntity {
  @Column({ name: 'salon_id', type: 'uuid' })
  salonId: string;

  @ManyToOne(() => Salon, (s) => s.staffAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @Column({ name: 'staff_member_id', type: 'uuid' })
  staffMemberId: string;

  @ManyToOne(() => StaffMember, (sm) => sm.salonAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;

  @Column({ type: 'enum', enum: StaffRole, default: StaffRole.STYLIST })
  role: StaffRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
