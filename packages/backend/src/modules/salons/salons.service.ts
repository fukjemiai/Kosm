import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salon } from '../../database/entities';
import { CreateSalonDto } from './dto/create-salon.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';

@Injectable()
export class SalonsService {
  constructor(
    @InjectRepository(Salon)
    private readonly repo: Repository<Salon>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSalonDto, userId: string): Promise<Salon> {
    const slug = this.generateSlug(dto.name);
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) throw new ConflictException(`Salon se slug "${slug}" již existuje`);

    const salon = this.repo.create({ ...dto, slug, createdBy: userId });
    const saved = await this.repo.save(salon);

    await this.audit.log({
      entityType: 'Salon',
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      newValues: dto as unknown as Record<string, unknown>,
    });

    return saved;
  }

  async findByOrganization(orgId: string): Promise<Salon[]> {
    return this.repo.find({
      where: { organizationId: orgId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Salon> {
    const salon = await this.repo.findOne({
      where: { id },
      relations: ['salonServices', 'salonServices.service', 'staffAssignments', 'staffAssignments.staffMember'],
    });
    if (!salon) throw new NotFoundException('Salon nenalezen');
    return salon;
  }

  async findBySlug(slug: string): Promise<Salon> {
    const salon = await this.repo.findOne({
      where: { slug, isActive: true },
      relations: ['salonServices', 'salonServices.service'],
    });
    if (!salon) throw new NotFoundException('Salon nenalezen');
    return salon;
  }

  async update(id: string, dto: Partial<CreateSalonDto>, userId: string): Promise<Salon> {
    const salon = await this.findById(id);
    const oldValues = { ...salon };
    Object.assign(salon, dto);
    salon.updatedBy = userId;
    const saved = await this.repo.save(salon);

    await this.audit.log({
      entityType: 'Salon',
      entityId: id,
      action: AuditAction.UPDATE,
      userId,
      oldValues: oldValues as unknown as Record<string, unknown>,
      newValues: dto as unknown as Record<string, unknown>,
    });

    return saved;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
