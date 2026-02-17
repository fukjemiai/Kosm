import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { SalonsModule } from './modules/salons/salons.module';
import { StaffModule } from './modules/staff/staff.module';
import { ServicesModule } from './modules/services/services.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'kosm'),
        password: config.get('DB_PASSWORD', 'kosm_dev'),
        database: config.get('DB_NAME', 'kosm'),
        entities: [path.join(__dirname, 'database/entities/*.entity.{ts,js}')],
        synchronize: false,
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    OrganizationsModule,
    SalonsModule,
    StaffModule,
    ServicesModule,
    AvailabilityModule,
    BookingsModule,
    CustomersModule,
    BillingModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
