import { Controller, Get, Post, Put, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Vytvořit novou organizaci' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.create(dto, user.keycloakId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Moje organizace' })
  findMine(@CurrentUser() user: RequestUser) {
    return this.service.findByOwner(user.keycloakId);
  }

  @Get(':id')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF, AppRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Detail organizace' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles(AppRole.ORG_OWNER)
  @ApiOperation({ summary: 'Upravit organizaci' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateOrganizationDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user.keycloakId);
  }
}
