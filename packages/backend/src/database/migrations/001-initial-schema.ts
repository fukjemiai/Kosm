import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "booking_status" AS ENUM (
        'PENDING','CONFIRMED','IN_PROGRESS','COMPLETED',
        'CANCELLED_BY_CUSTOMER','CANCELLED_BY_STAFF','NO_SHOW','RESCHEDULED'
      );
      CREATE TYPE "invoice_status" AS ENUM (
        'DRAFT','ISSUED','PAID','PARTIALLY_PAID','CANCELLED','REFUNDED'
      );
      CREATE TYPE "payment_method" AS ENUM (
        'CASH','CARD_TERMINAL','BANK_TRANSFER','ONLINE_GATEWAY'
      );
      CREATE TYPE "staff_role" AS ENUM (
        'OWNER','MANAGER','SENIOR_STYLIST','STYLIST','JUNIOR','RECEPTIONIST'
      );
      CREATE TYPE "shift_type" AS ENUM (
        'WORKING','BREAK','VACATION','SICK_LEAVE','BLOCKED'
      );
      CREATE TYPE "notification_channel" AS ENUM ('EMAIL','SMS','PUSH');
      CREATE TYPE "notification_type" AS ENUM (
        'BOOKING_CONFIRMATION','BOOKING_REMINDER','BOOKING_CANCELLED',
        'BOOKING_RESCHEDULED','GUEST_VERIFICATION','INVOICE_ISSUED'
      );
      CREATE TYPE "audit_action" AS ENUM (
        'CREATE','UPDATE','DELETE','STATUS_CHANGE','LOGIN','EXPORT'
      );
      CREATE TYPE "currency" AS ENUM ('CZK','EUR');
    `);

    // ── Organizations ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "owner_keycloak_id" varchar(255) NOT NULL,
        "description" varchar(500),
        "logo" varchar(500),
        "ico" varchar(100),
        "dic" varchar(100),
        "billing_address" jsonb,
        "default_currency" currency NOT NULL DEFAULT 'CZK',
        "vat_rate" decimal(5,2) NOT NULL DEFAULT 21.00,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);

    // ── Salons ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "salons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "address" jsonb NOT NULL,
        "phone" varchar(20),
        "email" varchar(255),
        "opening_hours" jsonb,
        "booking_buffer_minutes" int NOT NULL DEFAULT 0,
        "max_advance_booking_days" int NOT NULL DEFAULT 60,
        "min_advance_booking_hours" int NOT NULL DEFAULT 1,
        "allow_guest_booking" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_salon_org" ON "salons"("organization_id");
    `);

    // ── Staff Members ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "staff_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "keycloak_id" varchar(255) NOT NULL UNIQUE,
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "avatar" varchar(500),
        "bio" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_staff_org" ON "staff_members"("organization_id");
    `);

    // ── Salon ↔ Staff Assignment ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "salon_staff_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
        "staff_member_id" uuid NOT NULL REFERENCES "staff_members"("id") ON DELETE CASCADE,
        "role" staff_role NOT NULL DEFAULT 'STYLIST',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "UQ_salon_staff" UNIQUE ("salon_id", "staff_member_id")
      );
    `);

    // ── Service Categories ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "service_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "description" text,
        "sort_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);

    // ── Services ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "service_categories"("id") ON DELETE SET NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "duration_minutes" int NOT NULL,
        "buffer_before_minutes" int NOT NULL DEFAULT 0,
        "buffer_after_minutes" int NOT NULL DEFAULT 0,
        "base_price" decimal(10,2) NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_service_org" ON "services"("organization_id");
    `);

    // ── Salon ↔ Service (price override per salon) ──────────
    await queryRunner.query(`
      CREATE TABLE "salon_services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
        "price_override" decimal(10,2),
        "duration_override" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "UQ_salon_service" UNIQUE ("salon_id", "service_id")
      );
    `);

    // ── Customers ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "keycloak_id" varchar(255) UNIQUE,
        "first_name" varchar(100),
        "last_name" varchar(100),
        "email" varchar(255),
        "phone" varchar(20),
        "is_guest" boolean NOT NULL DEFAULT false,
        "notes" text,
        "gdpr_consent_at" timestamptz,
        "data_retention_until" timestamptz,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_customer_email" ON "customers"("email");
    `);

    // ── Shifts ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "shifts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "staff_member_id" uuid NOT NULL REFERENCES "staff_members"("id") ON DELETE CASCADE,
        "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "type" shift_type NOT NULL DEFAULT 'WORKING',
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_shift_staff_date" ON "shifts"("staff_member_id", "date");
      CREATE INDEX "IDX_shift_salon_date" ON "shifts"("salon_id", "date");
    `);

    // ── Bookings ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "booking_number" varchar(20) NOT NULL UNIQUE,
        "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
        "staff_member_id" uuid NOT NULL REFERENCES "staff_members"("id") ON DELETE CASCADE,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
        "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "start_time" timestamptz NOT NULL,
        "end_time" timestamptz NOT NULL,
        "buffer_before_minutes" int NOT NULL DEFAULT 0,
        "buffer_after_minutes" int NOT NULL DEFAULT 0,
        "status" booking_status NOT NULL DEFAULT 'PENDING',
        "price" decimal(10,2) NOT NULL,
        "note" text,
        "customer_note" text,
        "guest_token" varchar(255),
        "guest_token_expires_at" timestamptz,
        "rescheduled_to_id" uuid,
        "cancelled_at" timestamptz,
        "cancellation_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "CHK_booking_time" CHECK ("end_time" > "start_time")
      );
      CREATE INDEX "IDX_booking_salon_staff_time"
        ON "bookings"("salon_id", "staff_member_id", "start_time", "end_time");
      CREATE INDEX "IDX_booking_customer" ON "bookings"("customer_id");
      CREATE INDEX "IDX_booking_date" ON "bookings"("start_time");
    `);

    // ── Exclusion constraint: prevent double-booking ────────
    // Uses btree_gist extension for range-based exclusion
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS btree_gist;
    `);
    await queryRunner.query(`
      ALTER TABLE "bookings" ADD CONSTRAINT "EXCL_no_double_booking"
        EXCLUDE USING gist (
          "staff_member_id" WITH =,
          tstzrange("start_time", "end_time") WITH &&
        )
        WHERE (status NOT IN ('CANCELLED_BY_CUSTOMER','CANCELLED_BY_STAFF','NO_SHOW','RESCHEDULED'));
    `);

    // ── Invoices ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_number" varchar(30) NOT NULL UNIQUE,
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
        "booking_id" uuid NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
        "status" invoice_status NOT NULL DEFAULT 'DRAFT',
        "subtotal" decimal(10,2) NOT NULL,
        "vat_rate" decimal(5,2) NOT NULL,
        "vat_amount" decimal(10,2) NOT NULL,
        "total" decimal(10,2) NOT NULL,
        "currency" currency NOT NULL DEFAULT 'CZK',
        "issued_at" timestamptz,
        "due_date" date,
        "paid_at" timestamptz,
        "line_items" jsonb NOT NULL,
        "customer_snapshot" jsonb NOT NULL,
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_invoice_org_date" ON "invoices"("organization_id", "issued_at");
    `);

    // ── Payments ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
        "amount" decimal(10,2) NOT NULL,
        "method" payment_method NOT NULL,
        "paid_at" timestamptz NOT NULL,
        "transaction_ref" varchar(255),
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
      CREATE INDEX "IDX_payment_invoice" ON "payments"("invoice_id");
    `);

    // ── Audit Logs ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "entity_type" varchar(100) NOT NULL,
        "entity_id" uuid NOT NULL,
        "action" audit_action NOT NULL,
        "user_id" varchar(255),
        "user_email" varchar(255),
        "old_values" jsonb,
        "new_values" jsonb,
        "ip_address" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_audit_entity" ON "audit_logs"("entity_type", "entity_id");
      CREATE INDEX "IDX_audit_user" ON "audit_logs"("user_id");
      CREATE INDEX "IDX_audit_created" ON "audit_logs"("created_at");
    `);

    // ── Notification Logs ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
        "type" notification_type NOT NULL,
        "channel" notification_channel NOT NULL,
        "recipient" varchar(255) NOT NULL,
        "subject" varchar(500) NOT NULL,
        "sent" boolean NOT NULL DEFAULT false,
        "sent_at" timestamptz,
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_notification_booking" ON "notification_logs"("booking_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shifts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salon_services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salon_staff_assignments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "currency"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "staff_role"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status"`);
  }
}
