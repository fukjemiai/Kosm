import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon, SalonService as SalonServiceEntity, SalonStaffAssignment } from '../../database/entities';
import { SalonsService } from './salons.service';
import { SalonsController } from './salons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Salon, SalonServiceEntity, SalonStaffAssignment])],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
