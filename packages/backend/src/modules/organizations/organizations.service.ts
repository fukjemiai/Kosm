import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOrganizationDto, ownerKeycloakId: string): Promise<Organization> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Organizace se slug "${slug}" již existuje`);
    }

    const org = this.repo.create({
      ...dto,
      slug,
      ownerKeycloakId,
    });
    const saved = await this.repo.save(org);

    await this.audit.log({
      entityType: 'Organization',
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId: ownerKeycloakId,
      newValues: dto as unknown as Record<string, unknown>,
    });

    return saved;
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.repo.findOne({ where: { id }, relations: ['salons'] });
    if (!org) throw new NotFoundException('Organizace nenalezena');
    return org;
  }

  async findByOwner(ownerKeycloakId: string): Promise<Organization[]> {
    return this.repo.find({ where: { ownerKeycloakId, isActive: true } });
  }

  async update(id: string, dto: Partial<CreateOrganizationDto>, userId: string): Promise<Organization> {
    const org = await this.findById(id);
    const oldValues = { ...org };
    Object.assign(org, dto);
    const saved = await this.repo.save(org);

    await this.audit.log({
      entityType: 'Organization',
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
