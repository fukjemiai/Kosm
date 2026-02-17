import { Controller, Get, Post, Put, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffMemberDto, AssignStaffToSalonDto } from './dto/create-staff.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Post()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Vytvořit zaměstnance' })
  create(@Body() dto: CreateStaffMemberDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user.keycloakId);
  }

  @Get('by-org/:orgId')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Zaměstnanci organizace' })
  findByOrg(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get('by-salon/:salonId')
  @Public()
  @ApiOperation({ summary: 'Zaměstnanci salonu (veřejný)' })
  findBySalon(@Param('salonId', ParseUUIDPipe) salonId: string) {
    return this.service.findBySalon(salonId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Můj staff profil' })
  findMe(@CurrentUser() user: RequestUser) {
    return this.service.findByKeycloakId(user.keycloakId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail zaměstnance' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Upravit zaměstnance' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateStaffMemberDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user.keycloakId);
  }

  @Post('assign')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Přiřadit zaměstnance k salonu' })
  assign(@Body() dto: AssignStaffToSalonDto, @CurrentUser() user: RequestUser) {
    return this.service.assignToSalon(dto, user.keycloakId);
  }

  @Delete(':staffId/salon/:salonId')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Odebrat zaměstnance ze salonu' })
  removeFromSalon(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Param('salonId', ParseUUIDPipe) salonId: string,
  ) {
    return this.service.removeFromSalon(salonId, staffId);
  }
}
