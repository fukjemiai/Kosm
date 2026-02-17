import { IsString, IsUUID, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffRole } from '../../../common/enums';

export class CreateStaffMemberDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsString()
  keycloakId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
}

export class AssignStaffToSalonDto {
  @ApiProperty()
  @IsUUID()
  salonId: string;

  @ApiProperty()
  @IsUUID()
  staffMemberId: string;

  @ApiPropertyOptional({ enum: StaffRole, default: StaffRole.STYLIST })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;
}
