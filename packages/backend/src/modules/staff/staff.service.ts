import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMember, SalonStaffAssignment } from '../../database/entities';
import { CreateStaffMemberDto, AssignStaffToSalonDto } from './dto/create-staff.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepo: Repository<StaffMember>,
    @InjectRepository(SalonStaffAssignment)
    private readonly assignmentRepo: Repository<SalonStaffAssignment>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateStaffMemberDto, userId: string): Promise<StaffMember> {
    const existing = await this.staffRepo.findOne({ where: { keycloakId: dto.keycloakId } });
    if (existing) throw new ConflictException('Zaměstnanec s tímto Keycloak ID již existuje');

    const staff = this.staffRepo.create({ ...dto, createdBy: userId });
    const saved = await this.staffRepo.save(staff);

    await this.audit.log({
      entityType: 'StaffMember',
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      newValues: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email },
    });

    return saved;
  }

  async findByOrganization(orgId: string): Promise<StaffMember[]> {
    return this.staffRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: ['salonAssignments', 'salonAssignments.salon'],
      order: { lastName: 'ASC' },
    });
  }

  async findById(id: string): Promise<StaffMember> {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['salonAssignments', 'salonAssignments.salon'],
    });
    if (!staff) throw new NotFoundException('Zaměstnanec nenalezen');
    return staff;
  }

  async findByKeycloakId(keycloakId: string): Promise<StaffMember | null> {
    return this.staffRepo.findOne({
      where: { keycloakId },
      relations: ['salonAssignments'],
    });
  }

  async findBySalon(salonId: string): Promise<StaffMember[]> {
    const assignments = await this.assignmentRepo.find({
      where: { salonId, isActive: true },
      relations: ['staffMember'],
    });
    return assignments.map((a) => a.staffMember);
  }

  async assignToSalon(dto: AssignStaffToSalonDto, userId: string): Promise<SalonStaffAssignment> {
    const existing = await this.assignmentRepo.findOne({
      where: { salonId: dto.salonId, staffMemberId: dto.staffMemberId },
    });
    if (existing) throw new ConflictException('Zaměstnanec je již přiřazen k tomuto salonu');

    const assignment = this.assignmentRepo.create({
      ...dto,
      createdBy: userId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async removeFromSalon(salonId: string, staffMemberId: string): Promise<void> {
    await this.assignmentRepo.update(
      { salonId, staffMemberId },
      { isActive: false },
    );
  }

  async update(id: string, dto: Partial<CreateStaffMemberDto>, userId: string): Promise<StaffMember> {
    const staff = await this.findById(id);
    Object.assign(staff, dto);
    staff.updatedBy = userId;
    return this.staffRepo.save(staff);
  }
}
