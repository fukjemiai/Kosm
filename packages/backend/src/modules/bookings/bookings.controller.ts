import { Controller, Get, Post, Put, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  CreateGuestBookingDto,
  CancelBookingDto,
} from './dto/create-booking.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  // ── Customer (authenticated) ──────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vytvořit rezervaci (přihlášený zákazník)' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: RequestUser) {
    return this.service.createForCustomer(dto, user.keycloakId, user.email);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moje rezervace' })
  findMy(@CurrentUser() user: RequestUser, @Query() pagination: PaginationDto) {
    return this.service.findByCustomerKeycloak(user.keycloakId, pagination);
  }

  @Put(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Zrušit rezervaci (zákazník)' })
  cancelByCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.cancelByCustomer(id, dto, user.keycloakId);
  }

  // ── Guest ─────────────────────────────────────────────────

  @Post('guest')
  @Public()
  @ApiOperation({ summary: 'Vytvořit guest rezervaci' })
  createGuest(@Body() dto: CreateGuestBookingDto) {
    return this.service.createForGuest(dto);
  }

  @Get('guest/:token')
  @Public()
  @ApiOperation({ summary: 'Zobrazit guest rezervaci přes token' })
  findByGuestToken(@Param('token') token: string) {
    return this.service.findByGuestToken(token);
  }

  @Put('guest/:token/cancel')
  @Public()
  @ApiOperation({ summary: 'Zrušit guest rezervaci přes token' })
  cancelByGuestToken(@Param('token') token: string, @Body() dto: CancelBookingDto) {
    return this.service.cancelByGuestToken(token, dto);
  }

  // ── Staff ─────────────────────────────────────────────────

  @Get('salon/:salonId')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Rezervace salonu (s filtry)' })
  findBySalon(
    @Param('salonId', ParseUUIDPipe) salonId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('staffMemberId') staffMemberId?: string,
  ) {
    return this.service.findBySalonAndDateRange(
      salonId,
      new Date(from),
      new Date(to),
      staffMemberId,
    );
  }

  @Put(':id/complete')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Dokončit rezervaci' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.service.complete(id, user.keycloakId);
  }

  @Put(':id/no-show')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Označit jako no-show' })
  markNoShow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.service.markNoShow(id, user.keycloakId);
  }

  @Put(':id/cancel-staff')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Zrušit rezervaci (staff)' })
  cancelByStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.cancelByStaff(id, dto, user.keycloakId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail rezervace' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }
}
