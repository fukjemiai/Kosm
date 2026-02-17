import { Controller, Get, Post, Put, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, CreateServiceCategoryDto, AssignServiceToSalonDto } from './dto/create-service.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  // ── Categories ──────────────────────────────────────────
  @Post('categories')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Vytvořit kategorii služeb' })
  createCategory(@Body() dto: CreateServiceCategoryDto, @CurrentUser() user: RequestUser) {
    return this.service.createCategory(dto, user.keycloakId);
  }

  @Get('categories/by-org/:orgId')
  @Public()
  @ApiOperation({ summary: 'Kategorie služeb organizace' })
  findCategories(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.service.findCategoriesByOrg(orgId);
  }

  // ── Services ────────────────────────────────────────────
  @Post()
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Vytvořit službu' })
  createService(@Body() dto: CreateServiceDto, @CurrentUser() user: RequestUser) {
    return this.service.createService(dto, user.keycloakId);
  }

  @Get('by-org/:orgId')
  @Public()
  @ApiOperation({ summary: 'Služby organizace' })
  findByOrg(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get('by-salon/:salonId')
  @Public()
  @ApiOperation({ summary: 'Služby salonu (s efektivní cenou)' })
  findBySalon(@Param('salonId', ParseUUIDPipe) salonId: string) {
    return this.service.findBySalon(salonId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Detail služby' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Upravit službu' })
  updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateServiceDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.updateService(id, dto, user.keycloakId);
  }

  // ── Salon assignment ────────────────────────────────────
  @Post('assign-to-salon')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Přiřadit službu k salonu' })
  assignToSalon(@Body() dto: AssignServiceToSalonDto, @CurrentUser() user: RequestUser) {
    return this.service.assignToSalon(dto, user.keycloakId);
  }
}
