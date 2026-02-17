import { IsString, IsOptional, IsEnum, IsNumber, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../common/enums';

class AddressDto {
  @IsString() street: string;
  @IsString() city: string;
  @IsString() zip: string;
  @IsString() country: string;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Beauty Studio Praha' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ico?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiPropertyOptional({ enum: Currency, default: Currency.CZK })
  @IsOptional()
  @IsEnum(Currency)
  defaultCurrency?: Currency;

  @ApiPropertyOptional({ default: 21.0 })
  @IsOptional()
  @IsNumber()
  vatRate?: number;
}
