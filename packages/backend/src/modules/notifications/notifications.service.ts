import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { NotificationLog, Booking, Customer } from '../../database/entities';
import { NotificationType, NotificationChannel, BookingStatus } from '../../common/enums';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'localhost'),
      port: config.get<number>('MAIL_PORT', 1025),
      secure: false,
    });
  }

  async sendBookingConfirmation(booking: Booking, customer: Customer): Promise<void> {
    const email = customer.email;
    if (!email) return;

    const subject = `Potvrzení rezervace ${booking.bookingNumber}`;
    let body = `Dobrý den,\n\nVaše rezervace ${booking.bookingNumber} byla přijata.\n`;
    body += `Termín: ${booking.startTime.toLocaleString('cs-CZ')}\n`;

    if (booking.guestToken) {
      const baseUrl = this.config.get('CUSTOMER_FE_URL', 'http://localhost:5173');
      body += `\nSpráva rezervace: ${baseUrl}/booking/guest/${booking.guestToken}\n`;
      body += `(Tento odkaz slouží k zobrazení, úpravě nebo zrušení Vaší rezervace)\n`;
    }

    body += `\nDěkujeme,\nTým Kosm`;

    await this.sendEmail(email, subject, body, booking.id, NotificationType.BOOKING_CONFIRMATION);
  }

  async sendBookingReminder(booking: Booking, customer: Customer): Promise<void> {
    const email = customer.email;
    if (!email) return;

    const subject = `Připomínka: zítra máte rezervaci ${booking.bookingNumber}`;
    const body = `Dobrý den,\n\npřipomínáme Vám zítřejší rezervaci.\nTermín: ${booking.startTime.toLocaleString('cs-CZ')}\n\nTěšíme se na Vás!\nTým Kosm`;

    await this.sendEmail(email, subject, body, booking.id, NotificationType.BOOKING_REMINDER);
  }

  async sendCancellationNotice(booking: Booking, customer: Customer): Promise<void> {
    const email = customer.email;
    if (!email) return;

    const subject = `Zrušení rezervace ${booking.bookingNumber}`;
    const body = `Dobrý den,\n\nVaše rezervace ${booking.bookingNumber} byla zrušena.\n\nTým Kosm`;

    await this.sendEmail(email, subject, body, booking.id, NotificationType.BOOKING_CANCELLED);
  }

  /**
   * Cron: odesílá připomínky pro zítřejší bookings (jednou denně v 18:00).
   * Minimalistická varianta bez Redis – přímé zpracování v NestJS Scheduler.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendDailyReminders(): Promise<void> {
    this.logger.log('Odesílání připomínek pro zítřejší rezervace...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const bookings = await this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'c')
      .where('b.start_time::date = :date', { date: tomorrowStr })
      .andWhere('b.status = :status', { status: BookingStatus.CONFIRMED })
      .getMany();

    for (const booking of bookings) {
      try {
        await this.sendBookingReminder(booking, booking.customer);
      } catch (err) {
        this.logger.error(`Chyba při odesílání připomínky pro ${booking.bookingNumber}`, err);
      }
    }

    this.logger.log(`Odesláno ${bookings.length} připomínek`);
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    bookingId: string | null,
    type: NotificationType,
  ): Promise<void> {
    const log = this.logRepo.create({
      bookingId,
      type,
      channel: NotificationChannel.EMAIL,
      recipient: to,
      subject,
    });

    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM', 'noreply@kosm.local'),
        to,
        subject,
        text,
      });
      log.sent = true;
      log.sentAt = new Date();
    } catch (err: any) {
      log.errorMessage = err.message;
      this.logger.error(`Chyba odesílání emailu na ${to}`, err);
    }

    await this.logRepo.save(log);
  }
}
