// ── Booking States ──────────────────────────────────────────
export enum BookingStatus {
  PENDING = 'PENDING',           // Čeká na potvrzení (guest / auto)
  CONFIRMED = 'CONFIRMED',       // Potvrzená rezervace
  IN_PROGRESS = 'IN_PROGRESS',   // Právě probíhá
  COMPLETED = 'COMPLETED',       // Dokončená
  CANCELLED_BY_CUSTOMER = 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_STAFF = 'CANCELLED_BY_STAFF',
  NO_SHOW = 'NO_SHOW',           // Klientka se nedostavila
  RESCHEDULED = 'RESCHEDULED',   // Přebookováno (odkaz na novou)
}

// ── Invoice / Receipt States ────────────────────────────────
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// ── Payment Method ──────────────────────────────────────────
export enum PaymentMethod {
  CASH = 'CASH',
  CARD_TERMINAL = 'CARD_TERMINAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
}

// ── Staff Role within salon context ─────────────────────────
export enum StaffRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  SENIOR_STYLIST = 'SENIOR_STYLIST',
  STYLIST = 'STYLIST',
  JUNIOR = 'JUNIOR',
  RECEPTIONIST = 'RECEPTIONIST',
}

// ── Keycloak / App-level Roles ──────────────────────────────
export enum AppRole {
  ORG_OWNER = 'org_owner',
  SALON_MANAGER = 'salon_manager',
  STAFF = 'staff',
  ACCOUNTANT = 'accountant',
  CUSTOMER = 'customer',
}

// ── Shift / Availability ────────────────────────────────────
export enum ShiftType {
  WORKING = 'WORKING',
  BREAK = 'BREAK',
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  BLOCKED = 'BLOCKED',
}

// ── Notification Channel ────────────────────────────────────
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

// ── Notification Type ───────────────────────────────────────
export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  GUEST_VERIFICATION = 'GUEST_VERIFICATION',
  INVOICE_ISSUED = 'INVOICE_ISSUED',
}

// ── Audit Action ────────────────────────────────────────────
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  LOGIN = 'LOGIN',
  EXPORT = 'EXPORT',
}

// ── Day of week ─────────────────────────────────────────────
export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

// ── Currency ────────────────────────────────────────────────
export enum Currency {
  CZK = 'CZK',
  EUR = 'EUR',
}
