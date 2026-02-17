import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog, Booking } from '../../database/entities';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog, Booking])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
