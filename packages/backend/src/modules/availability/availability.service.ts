import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Shift, Booking } from '../../database/entities';
import { ShiftType, BookingStatus } from '../../common/enums';

export interface TimeSlot {
  start: string; // ISO string
  end: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  /**
   * Vrátí dostupné sloty pro daného zaměstnance v daný den.
   * Zohledňuje: směny, existující rezervace, buffery.
   */
  async getAvailableSlots(
    staffMemberId: string,
    salonId: string,
    date: string, // YYYY-MM-DD
    durationMinutes: number,
    bufferBefore: number = 0,
    bufferAfter: number = 0,
    slotStepMinutes: number = 15,
  ): Promise<TimeSlot[]> {
    // 1. Najdi pracovní směny pro tento den
    const shifts = await this.shiftRepo.find({
      where: {
        staffMemberId,
        salonId,
        date,
        type: ShiftType.WORKING,
      },
    });

    if (shifts.length === 0) return [];

    // 2. Najdi neaktivní blokace (dovolené, pauzy, nemoci)
    const blocks = await this.shiftRepo.find({
      where: {
        staffMemberId,
        date,
        type: In([ShiftType.BREAK, ShiftType.VACATION, ShiftType.SICK_LEAVE, ShiftType.BLOCKED]),
      },
    });

    // 3. Najdi existující rezervace (jen aktivní)
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const existingBookings = await this.bookingRepo.find({
      where: {
        staffMemberId,
        startTime: Between(dayStart, dayEnd),
        status: Not(In([
          BookingStatus.CANCELLED_BY_CUSTOMER,
          BookingStatus.CANCELLED_BY_STAFF,
          BookingStatus.NO_SHOW,
          BookingStatus.RESCHEDULED,
        ])),
      },
    });

    // 4. Vygeneruj volné sloty
    const totalSlotDuration = bufferBefore + durationMinutes + bufferAfter;
    const availableSlots: TimeSlot[] = [];

    for (const shift of shifts) {
      const shiftStart = this.timeToMinutes(shift.startTime);
      const shiftEnd = this.timeToMinutes(shift.endTime);

      for (let cursor = shiftStart; cursor + totalSlotDuration <= shiftEnd; cursor += slotStepMinutes) {
        const slotStart = cursor + bufferBefore;
        const slotEnd = slotStart + durationMinutes;
        const blockStart = cursor;
        const blockEnd = cursor + totalSlotDuration;

        // Zkontroluj kolize s blokacemi
        const hasBlockConflict = blocks.some((b) => {
          const bStart = this.timeToMinutes(b.startTime);
          const bEnd = this.timeToMinutes(b.endTime);
          return blockStart < bEnd && blockEnd > bStart;
        });
        if (hasBlockConflict) continue;

        // Zkontroluj kolize s existujícími rezervacemi
        const hasBookingConflict = existingBookings.some((booking) => {
          const bStart = this.dateToMinutesOfDay(booking.startTime, date);
          const bEnd = this.dateToMinutesOfDay(booking.endTime, date);
          // Include buffers of existing booking
          const existingBlockStart = bStart - booking.bufferBeforeMinutes;
          const existingBlockEnd = bEnd + booking.bufferAfterMinutes;
          return blockStart < existingBlockEnd && blockEnd > existingBlockStart;
        });
        if (hasBookingConflict) continue;

        availableSlots.push({
          start: this.minutesToIso(date, slotStart),
          end: this.minutesToIso(date, slotEnd),
        });
      }
    }

    return availableSlots;
  }

  /**
   * Vrátí dny s alespoň jedním volným slotem v daném měsíci.
   */
  async getAvailableDays(
    staffMemberId: string,
    salonId: string,
    year: number,
    month: number,
    durationMinutes: number,
  ): Promise<string[]> {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const shifts = await this.shiftRepo.find({
      where: {
        staffMemberId,
        salonId,
        type: ShiftType.WORKING,
      },
    });

    const availableDays: string[] = [];
    for (const shift of shifts) {
      const shiftDate = new Date(shift.date);
      if (shiftDate >= firstDay && shiftDate <= lastDay) {
        if (!availableDays.includes(shift.date)) {
          availableDays.push(shift.date);
        }
      }
    }

    return availableDays.sort();
  }

  // ── Shift Management ──────────────────────────────────────

  async createShift(data: Partial<Shift>): Promise<Shift> {
    const shift = this.shiftRepo.create(data);
    return this.shiftRepo.save(shift);
  }

  async getShifts(staffMemberId: string, from: string, to: string): Promise<Shift[]> {
    return this.shiftRepo
      .createQueryBuilder('s')
      .where('s.staff_member_id = :staffMemberId', { staffMemberId })
      .andWhere('s.date BETWEEN :from AND :to', { from, to })
      .orderBy('s.date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .getMany();
  }

  async deleteShift(id: string): Promise<void> {
    await this.shiftRepo.delete(id);
  }

  // ── Helpers ───────────────────────────────────────────────

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private dateToMinutesOfDay(date: Date, dayStr: string): number {
    const day = new Date(`${dayStr}T00:00:00Z`);
    return Math.floor((date.getTime() - day.getTime()) / 60000);
  }

  private minutesToIso(date: string, minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${date}T${h}:${m}:00`;
  }
}
