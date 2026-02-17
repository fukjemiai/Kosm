import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, Payment, Booking, Organization } from '../../database/entities';
import { InvoiceStatus, BookingStatus, AuditAction } from '../../common/enums';
import { CreateInvoiceFromBookingDto, RecordPaymentDto } from './dto/billing.dto';
import { AuditService } from '../audit/audit.service';
import { stringify } from 'csv-stringify/sync';
import * as ExcelJS from 'exceljs';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly audit: AuditService,
  ) {}

  /**
   * Vystaví doklad (účtenku/fakturu) z dokončené rezervace.
   */
  async createFromBooking(dto: CreateInvoiceFromBookingDto, userId: string): Promise<Invoice> {
    // 1. Najdi booking
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['salon', 'salon.organization', 'service', 'customer'],
    });
    if (!booking) throw new NotFoundException('Rezervace nenalezena');

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Doklad lze vystavit pouze z dokončené rezervace');
    }

    // 2. Zkontroluj, že ještě nemá doklad
    const existing = await this.invoiceRepo.findOne({ where: { bookingId: booking.id } });
    if (existing) throw new ConflictException('Pro tuto rezervaci již existuje doklad');

    // 3. Vypočítej DPH
    const org = booking.salon.organization;
    const vatRate = Number(org.vatRate);
    const subtotal = Number(booking.price);
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = subtotal + vatAmount;

    // 4. Vytvoř doklad
    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(),
      organizationId: org.id,
      salonId: booking.salonId,
      bookingId: booking.id,
      status: InvoiceStatus.ISSUED,
      subtotal,
      vatRate,
      vatAmount,
      total,
      currency: org.defaultCurrency,
      issuedAt: new Date(),
      lineItems: [
        {
          description: booking.service.name,
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal,
        },
      ],
      customerSnapshot: {
        name: [booking.customer.firstName, booking.customer.lastName].filter(Boolean).join(' ') || 'Host',
        email: booking.customer.email || undefined,
        phone: booking.customer.phone || undefined,
      },
      note: dto.note || null,
      createdBy: userId,
    });

    const saved = await this.invoiceRepo.save(invoice);

    await this.audit.log({
      entityType: 'Invoice',
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      newValues: { invoiceNumber: saved.invoiceNumber, total, bookingId: booking.id },
    });

    return saved;
  }

  /**
   * Zaznamená platbu k dokladu.
   */
  async recordPayment(dto: RecordPaymentDto, userId: string): Promise<Payment> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoiceId },
      relations: ['payments'],
    });
    if (!invoice) throw new NotFoundException('Doklad nenalezen');

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + dto.amount;

    if (totalPaid > Number(invoice.total)) {
      throw new BadRequestException('Celková platba přesahuje částku dokladu');
    }

    const payment = this.paymentRepo.create({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      method: dto.method,
      paidAt: new Date(),
      transactionRef: dto.transactionRef || null,
      note: dto.note || null,
      createdBy: userId,
    });
    const saved = await this.paymentRepo.save(payment);

    // Aktualizuj status dokladu
    if (totalPaid >= Number(invoice.total)) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
    } else {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }
    await this.invoiceRepo.save(invoice);

    await this.audit.log({
      entityType: 'Payment',
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      newValues: { amount: dto.amount, method: dto.method, invoiceId: dto.invoiceId },
    });

    return saved;
  }

  async findInvoicesByOrganization(
    orgId: string,
    from?: Date,
    to?: Date,
  ): Promise<Invoice[]> {
    const where: any = { organizationId: orgId };
    if (from && to) {
      where.issuedAt = Between(from, to);
    }
    return this.invoiceRepo.find({
      where,
      relations: ['payments', 'booking'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['payments', 'booking', 'booking.service', 'booking.staffMember', 'salon'],
    });
    if (!invoice) throw new NotFoundException('Doklad nenalezen');
    return invoice;
  }

  // ── Exporty ───────────────────────────────────────────────

  async exportCsv(orgId: string, from: string, to: string): Promise<string> {
    const invoices = await this.findInvoicesForExport(orgId, from, to);

    const records = invoices.map((inv) => ({
      cislo_dokladu: inv.invoiceNumber,
      datum_vystaveni: inv.issuedAt?.toISOString().slice(0, 10) || '',
      zakaznik: inv.customerSnapshot?.name || '',
      zaklad: inv.subtotal,
      dph_sazba: `${inv.vatRate}%`,
      dph: inv.vatAmount,
      celkem: inv.total,
      mena: inv.currency,
      stav: inv.status,
      datum_uhrady: inv.paidAt?.toISOString().slice(0, 10) || '',
    }));

    return stringify(records, {
      header: true,
      columns: {
        cislo_dokladu: 'Číslo dokladu',
        datum_vystaveni: 'Datum vystavení',
        zakaznik: 'Zákazník',
        zaklad: 'Základ',
        dph_sazba: 'Sazba DPH',
        dph: 'DPH',
        celkem: 'Celkem',
        mena: 'Měna',
        stav: 'Stav',
        datum_uhrady: 'Datum úhrady',
      },
      delimiter: ';',
      bom: true,
    });
  }

  async exportXlsx(orgId: string, from: string, to: string): Promise<Buffer> {
    const invoices = await this.findInvoicesForExport(orgId, from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Doklady');

    sheet.columns = [
      { header: 'Číslo dokladu', key: 'invoiceNumber', width: 18 },
      { header: 'Datum vystavení', key: 'issuedAt', width: 14 },
      { header: 'Zákazník', key: 'customer', width: 25 },
      { header: 'Základ', key: 'subtotal', width: 12 },
      { header: 'Sazba DPH', key: 'vatRate', width: 10 },
      { header: 'DPH', key: 'vatAmount', width: 12 },
      { header: 'Celkem', key: 'total', width: 12 },
      { header: 'Měna', key: 'currency', width: 6 },
      { header: 'Stav', key: 'status', width: 14 },
      { header: 'Datum úhrady', key: 'paidAt', width: 14 },
    ];

    for (const inv of invoices) {
      sheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        issuedAt: inv.issuedAt?.toISOString().slice(0, 10) || '',
        customer: inv.customerSnapshot?.name || '',
        subtotal: Number(inv.subtotal),
        vatRate: `${inv.vatRate}%`,
        vatAmount: Number(inv.vatAmount),
        total: Number(inv.total),
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString().slice(0, 10) || '',
      });
    }

    // Header style
    sheet.getRow(1).font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async findInvoicesForExport(orgId: string, from: string, to: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: {
        organizationId: orgId,
        issuedAt: Between(new Date(from), new Date(`${to}T23:59:59`)),
      },
      relations: ['payments'],
      order: { issuedAt: 'ASC' },
    });
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${y}${m}-${random}`;
  }
}
