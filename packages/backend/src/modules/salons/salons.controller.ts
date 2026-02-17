import { Controller, Get, Post, Put, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Salons')
@Controller('salons')
export class SalonsController {
  constructor(private readonly service: SalonsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER)
  @ApiOperation({ summary: 'Vytvořit nový salon' })
  create(@Body() dto: CreateSalonDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user.keycloakId);
  }

  @Get('by-org/:orgId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salony organizace' })
  findByOrg(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Salon dle slug (veřejný)' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail salonu' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER)
  @ApiOperation({ summary: 'Upravit salon' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateSalonDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user.keycloakId);
  }
}
