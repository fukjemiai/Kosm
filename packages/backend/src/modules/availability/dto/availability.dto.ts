import { IsUUID, IsString, IsInt, IsOptional, IsEnum, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../../common/enums';

export class GetSlotsDto {
  @ApiProperty()
  @IsUUID()
  staffMemberId: string;

  @ApiProperty()
  @IsUUID()
  salonId: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;
}

export class CreateShiftDto {
  @ApiProperty()
  @IsUUID()
  staffMemberId: string;

  @ApiProperty()
  @IsUUID()
  salonId: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @ApiPropertyOptional({ enum: ShiftType, default: ShiftType.WORKING })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
