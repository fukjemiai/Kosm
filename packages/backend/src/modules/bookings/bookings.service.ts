import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, Customer } from '../../database/entities';
import { BookingStatus, AuditAction } from '../../common/enums';
import { ServicesService } from '../services/services.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateBookingDto, CreateGuestBookingDto, CancelBookingDto, RescheduleBookingDto } from './dto/create-booking.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly dataSource: DataSource,
    private readonly servicesService: ServicesService,
    private readonly customersService: CustomersService,
    private readonly notificationsService: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Vytvoří rezervaci pro přihlášeného zákazníka.
   * Používá SERIALIZABLE transakci k prevenci double-bookingu.
   */
  async createForCustomer(
    dto: CreateBookingDto,
    keycloakId: string,
    email: string,
  ): Promise<Booking> {
    const customer = await this.customersService.findOrCreateByKeycloak(keycloakId, email);
    return this.createBookingInTransaction(dto, customer, keycloakId);
  }

  /**
   * Vytvoří guest rezervaci – vyžaduje e-mail, generuje guest_token.
   */
  async createForGuest(dto: CreateGuestBookingDto): Promise<Booking> {
    const customer = await this.customersService.findOrCreateGuest(
      dto.guestEmail,
      dto.guestPhone,
      { first: dto.guestFirstName, last: dto.guestLastName },
    );
    return this.createBookingInTransaction(dto, customer, null, true);
  }

  /**
   * Jádro booking logiky – atomická transakce s pesimistickým lockováním.
   */
  private async createBookingInTransaction(
    dto: CreateBookingDto,
    customer: Customer,
    userId: string | null,
    isGuest: boolean = false,
  ): Promise<Booking> {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      // 1. Zjisti efektivní parametry služby
      const details = await this.servicesService.getEffectiveServiceDetails(
        dto.salonId,
        dto.serviceId,
      );

      const startTime = new Date(dto.startTime);
      const endTime = new Date(startTime.getTime() + details.durationMinutes * 60_000);

      // 2. Validace: není v minulosti
      if (startTime <= new Date()) {
        throw new BadRequestException('Nelze vytvořit rezervaci v minulosti');
      }

      // 3. Atomická kontrola kolize – pesimistický lock na existující booking
      const conflicting = await manager
        .createQueryBuilder(Booking, 'b')
        .setLock('pessimistic_write')
        .where('b.staff_member_id = :staffId', { staffId: dto.staffMemberId })
        .andWhere('b.status NOT IN (:...excludeStatuses)', {
          excludeStatuses: [
            BookingStatus.CANCELLED_BY_CUSTOMER,
            BookingStatus.CANCELLED_BY_STAFF,
            BookingStatus.NO_SHOW,
            BookingStatus.RESCHEDULED,
          ],
        })
        .andWhere(
          `tstzrange(b.start_time - (b.buffer_before_minutes || ' minutes')::interval,
                     b.end_time + (b.buffer_after_minutes || ' minutes')::interval)
           && tstzrange(:bufStart, :bufEnd)`,
          {
            bufStart: new Date(startTime.getTime() - details.bufferBefore * 60_000),
            bufEnd: new Date(endTime.getTime() + details.bufferAfter * 60_000),
          },
        )
        .getOne();

      if (conflicting) {
        throw new ConflictException('Zvolený termín je obsazený');
      }

      // 4. Vygeneruj booking number
      const bookingNumber = this.generateBookingNumber();

      // 5. Guest token
      let guestToken: string | null = null;
      let guestTokenExpiresAt: Date | null = null;
      if (isGuest) {
        guestToken = this.generateGuestToken(bookingNumber);
        guestTokenExpiresAt = new Date(
          startTime.getTime() + 24 * 60 * 60_000, // Expires 24h after booking start
        );
      }

      // 6. Vytvoř booking
      const booking = manager.create(Booking, {
        bookingNumber,
        salonId: dto.salonId,
        staffMemberId: dto.staffMemberId,
        serviceId: dto.serviceId,
        customerId: customer.id,
        startTime,
        endTime,
        bufferBeforeMinutes: details.bufferBefore,
        bufferAfterMinutes: details.bufferAfter,
        price: details.price,
        status: isGuest ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
        customerNote: dto.customerNote || null,
        guestToken,
        guestTokenExpiresAt,
        createdBy: userId,
      });

      const saved = await manager.save(booking);

      // 7. Audit log
      await this.audit.log({
        entityType: 'Booking',
        entityId: saved.id,
        action: AuditAction.CREATE,
        userId,
        newValues: {
          bookingNumber,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: saved.status,
        },
      });

      // 8. Notifikace (asynchronně)
      this.notificationsService.sendBookingConfirmation(saved, customer).catch(() => {});

      return saved;
    });
  }

  // ── Storno ────────────────────────────────────────────────

  async cancelByCustomer(id: string, dto: CancelBookingDto, keycloakId?: string): Promise<Booking> {
    const booking = await this.findById(id);

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Tuto rezervaci nelze zrušit');
    }

    const oldStatus = booking.status;
    booking.status = BookingStatus.CANCELLED_BY_CUSTOMER;
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.reason || null;
    const saved = await this.repo.save(booking);

    await this.audit.log({
      entityType: 'Booking',
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      userId: keycloakId || null,
      oldValues: { status: oldStatus },
      newValues: { status: saved.status, reason: dto.reason },
    });

    return saved;
  }

  async cancelByStaff(id: string, dto: CancelBookingDto, userId: string): Promise<Booking> {
    const booking = await this.findById(id);

    if ([BookingStatus.COMPLETED, BookingStatus.CANCELLED_BY_CUSTOMER, BookingStatus.CANCELLED_BY_STAFF].includes(booking.status)) {
      throw new BadRequestException('Tuto rezervaci nelze zrušit');
    }

    const oldStatus = booking.status;
    booking.status = BookingStatus.CANCELLED_BY_STAFF;
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.reason || null;
    const saved = await this.repo.save(booking);

    await this.audit.log({
      entityType: 'Booking',
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      userId,
      oldValues: { status: oldStatus },
      newValues: { status: saved.status },
    });

    return saved;
  }

  async markNoShow(id: string, userId: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Nelze označit jako no-show');
    }

    booking.status = BookingStatus.NO_SHOW;
    const saved = await this.repo.save(booking);

    await this.audit.log({
      entityType: 'Booking',
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      userId,
      oldValues: { status: BookingStatus.CONFIRMED },
      newValues: { status: BookingStatus.NO_SHOW },
    });

    return saved;
  }

  async complete(id: string, userId: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (![BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)) {
      throw new BadRequestException('Nelze dokončit tuto rezervaci');
    }

    booking.status = BookingStatus.COMPLETED;
    return this.repo.save(booking);
  }

  // ── Guest token ope rations ────────────────────────────────

  async cancelByGuestToken(token: string, dto: CancelBookingDto): Promise<Booking> {
    const booking = await this.repo.findOne({ where: { guestToken: token } });
    if (!booking) throw new NotFoundException('Neplatný token');
    if (booking.guestTokenExpiresAt && booking.guestTokenExpiresAt < new Date()) {
      throw new ForbiddenException('Token vypršel');
    }
    return this.cancelByCustomer(booking.id, dto);
  }

  async findByGuestToken(token: string): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { guestToken: token },
      relations: ['salon', 'staffMember', 'service', 'customer'],
    });
    if (!booking) throw new NotFoundException('Neplatný token');
    return booking;
  }

  // ── Queries ───────────────────────────────────────────────

  async findById(id: string): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: ['salon', 'staffMember', 'service', 'customer'],
    });
    if (!booking) throw new NotFoundException('Rezervace nenalezena');
    return booking;
  }

  async findByCustomerKeycloak(keycloakId: string, pagination: PaginationDto): Promise<PaginatedResult<Booking>> {
    const customer = await this.customersService.findByKeycloakId(keycloakId);
    if (!customer) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };

    const [data, total] = await this.repo.findAndCount({
      where: { customerId: customer.id },
      relations: ['salon', 'staffMember', 'service'],
      order: { startTime: 'DESC' },
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      take: pagination.limit || 20,
    });

    return {
      data,
      meta: {
        total,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(total / (pagination.limit || 20)),
      },
    };
  }

  async findBySalonAndDateRange(
    salonId: string,
    from: Date,
    to: Date,
    staffMemberId?: string,
  ): Promise<Booking[]> {
    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'customer')
      .leftJoinAndSelect('b.staffMember', 'staff')
      .leftJoinAndSelect('b.service', 'service')
      .where('b.salon_id = :salonId', { salonId })
      .andWhere('b.start_time >= :from', { from })
      .andWhere('b.start_time <= :to', { to })
      .orderBy('b.start_time', 'ASC');

    if (staffMemberId) {
      qb.andWhere('b.staff_member_id = :staffMemberId', { staffMemberId });
    }

    return qb.getMany();
  }

  // ── Helpers ───────────────────────────────────────────────

  private generateBookingNumber(): string {
    const date = new Date();
    const prefix = `B${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
  }

  private generateGuestToken(bookingNumber: string): string {
    const secret = process.env.GUEST_TOKEN_SECRET || 'dev-secret';
    const random = randomBytes(16).toString('hex');
    return createHmac('sha256', secret)
      .update(`${bookingNumber}:${random}`)
      .digest('hex')
      .slice(0, 48);
  }
}
