import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities';
import { AuditAction } from '../../common/enums';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    userId?: string | null;
    userEmail?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
  }): Promise<void> {
    await this.repo.insert({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId ?? null,
      userEmail: params.userEmail ?? null,
      oldValues: (params.oldValues ?? null) as any,
      newValues: (params.newValues ?? null) as any,
      ipAddress: params.ipAddress ?? null,
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
