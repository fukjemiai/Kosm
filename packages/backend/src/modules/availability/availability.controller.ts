import { Controller, Get, Post, Delete, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { ServicesService } from '../services/services.service';
import { GetSlotsDto, CreateShiftDto } from './dto/availability.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get('slots')
  @Public()
  @ApiOperation({ summary: 'Dostupné sloty pro zaměstnance na den' })
  async getSlots(@Query() dto: GetSlotsDto) {
    const details = await this.servicesService.getEffectiveServiceDetails(
      dto.salonId,
      dto.serviceId,
    );
    return this.availabilityService.getAvailableSlots(
      dto.staffMemberId,
      dto.salonId,
      dto.date,
      details.durationMinutes,
      details.bufferBefore,
      details.bufferAfter,
    );
  }

  @Get('days')
  @Public()
  @ApiOperation({ summary: 'Dny s dostupností v měsíci' })
  async getAvailableDays(
    @Query('staffMemberId') staffMemberId: string,
    @Query('salonId') salonId: string,
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('serviceId') serviceId: string,
  ) {
    const details = await this.servicesService.getEffectiveServiceDetails(salonId, serviceId);
    return this.availabilityService.getAvailableDays(
      staffMemberId,
      salonId,
      year,
      month,
      details.durationMinutes,
    );
  }

  // ── Shifts (staff only) ───────────────────────────────────

  @Post('shifts')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Vytvořit směnu' })
  createShift(@Body() dto: CreateShiftDto, @CurrentUser() user: RequestUser) {
    return this.availabilityService.createShift({
      ...dto,
      createdBy: user.keycloakId,
    } as any);
  }

  @Get('shifts/:staffMemberId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Směny zaměstnance' })
  getShifts(
    @Param('staffMemberId', ParseUUIDPipe) staffMemberId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.availabilityService.getShifts(staffMemberId, from, to);
  }

  @Delete('shifts/:id')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Smazat směnu' })
  deleteShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilityService.deleteShift(id);
  }
}
