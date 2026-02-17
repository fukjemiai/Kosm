import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServiceCategory, SalonService } from '../../database/entities';
import { CreateServiceDto, CreateServiceCategoryDto, AssignServiceToSalonDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(SalonService)
    private readonly salonServiceRepo: Repository<SalonService>,
  ) {}

  // ── Categories ──────────────────────────────────────────
  async createCategory(dto: CreateServiceCategoryDto, userId: string): Promise<ServiceCategory> {
    const cat = this.categoryRepo.create({ ...dto, createdBy: userId });
    return this.categoryRepo.save(cat);
  }

  async findCategoriesByOrg(orgId: string): Promise<ServiceCategory[]> {
    return this.categoryRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: ['services'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // ── Services ────────────────────────────────────────────
  async createService(dto: CreateServiceDto, userId: string): Promise<Service> {
    const service = this.serviceRepo.create({ ...dto, createdBy: userId });
    return this.serviceRepo.save(service);
  }

  async findByOrganization(orgId: string): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: ['category'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id }, relations: ['category'] });
    if (!service) throw new NotFoundException('Služba nenalezena');
    return service;
  }

  async updateService(id: string, dto: Partial<CreateServiceDto>, userId: string): Promise<Service> {
    const service = await this.findById(id);
    Object.assign(service, dto);
    service.updatedBy = userId;
    return this.serviceRepo.save(service);
  }

  // ── Salon ↔ Service ─────────────────────────────────────
  async assignToSalon(dto: AssignServiceToSalonDto, userId: string): Promise<SalonService> {
    const existing = await this.salonServiceRepo.findOne({
      where: { salonId: dto.salonId, serviceId: dto.serviceId },
    });
    if (existing) throw new ConflictException('Služba je již přiřazena k tomuto salonu');

    const salonService = this.salonServiceRepo.create({ ...dto, createdBy: userId });
    return this.salonServiceRepo.save(salonService);
  }

  async findBySalon(salonId: string): Promise<SalonService[]> {
    return this.salonServiceRepo.find({
      where: { salonId, isActive: true },
      relations: ['service', 'service.category'],
      order: { service: { sortOrder: 'ASC' } },
    });
  }

  /**
   * Vrátí efektivní cenu a délku služby pro daný salon.
   * Pokud je nastaven override, použije ho; jinak vezme base.
   */
  async getEffectiveServiceDetails(
    salonId: string,
    serviceId: string,
  ): Promise<{ price: number; durationMinutes: number; bufferBefore: number; bufferAfter: number }> {
    const salonService = await this.salonServiceRepo.findOne({
      where: { salonId, serviceId, isActive: true },
      relations: ['service'],
    });
    if (!salonService) throw new NotFoundException('Služba není dostupná v tomto salonu');

    const service = salonService.service;
    return {
      price: salonService.priceOverride ?? service.basePrice,
      durationMinutes: salonService.durationOverride ?? service.durationMinutes,
      bufferBefore: service.bufferBeforeMinutes,
      bufferAfter: service.bufferAfterMinutes,
    };
  }
}
