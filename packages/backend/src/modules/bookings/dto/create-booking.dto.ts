import { IsUUID, IsString, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  salonId: string;

  @ApiProperty()
  @IsUUID()
  staffMemberId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-03-15T10:00:00', description: 'Začátek služby (bez bufferu)' })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Poznámka zákazníka' })
  @IsOptional()
  @IsString()
  customerNote?: string;
}

export class CreateGuestBookingDto extends CreateBookingDto {
  @ApiProperty({ description: 'E-mail hosta' })
  @IsEmail()
  guestEmail: string;

  @ApiPropertyOptional({ description: 'Telefon hosta' })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestLastName?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RescheduleBookingDto {
  @ApiProperty({ example: '2026-03-16T14:00:00' })
  @IsString()
  newStartTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  newStaffMemberId?: string;
}
