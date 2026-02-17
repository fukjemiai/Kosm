import { IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max, ValidateNested, MaxLength, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SalonAddressDto {
  @IsString() street: string;
  @IsString() city: string;
  @IsString() zip: string;
  @IsString() country: string;
  @IsOptional() @IsInt() lat?: number;
  @IsOptional() @IsInt() lng?: number;
}

export class CreateSalonDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Studio Centrum' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SalonAddressDto)
  address: SalonAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  openingHours?: Record<number, { open: string; close: string } | null>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  bookingBufferMinutes?: number;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxAdvanceBookingDays?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minAdvanceBookingHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowGuestBooking?: boolean;
}
