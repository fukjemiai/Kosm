import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StaffMember } from './staff-member.entity';
import { Salon } from './salon.entity';
import { ShiftType } from '../../common/enums';

@Entity('shifts')
@Index('IDX_shift_staff_date', ['staffMemberId', 'date'])
@Index('IDX_shift_salon_date', ['salonId', 'date'])
export class Shift extends BaseEntity {
  @Column({ name: 'staff_member_id', type: 'uuid' })
  staffMemberId: string;

  @ManyToOne(() => StaffMember, (sm) => sm.shifts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;

  @Column({ name: 'salon_id', type: 'uuid' })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: ShiftType, default: ShiftType.WORKING })
  type: ShiftType;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
