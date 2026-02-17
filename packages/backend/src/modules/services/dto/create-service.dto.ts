import { IsString, IsUUID, IsOptional, IsInt, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Klasická manikúra' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 60, description: 'Délka služby v minutách' })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMinutes?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMinutes?: number;

  @ApiProperty({ example: 500.00, description: 'Základní cena (CZK)' })
  @IsNumber()
  @Min(0)
  basePrice: number;
}

export class CreateServiceCategoryDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Nehty' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class AssignServiceToSalonDto {
  @ApiProperty()
  @IsUUID()
  salonId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ description: 'Cena přepsaná pro tento salon' })
  @IsOptional()
  @IsNumber()
  priceOverride?: number;

  @ApiPropertyOptional({ description: 'Délka přepsaná pro tento salon (min)' })
  @IsOptional()
  @IsInt()
  durationOverride?: number;
}
