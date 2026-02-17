import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Můj zákaznický profil' })
  findMe(@CurrentUser() user: RequestUser) {
    return this.service.findByKeycloakId(user.keycloakId);
  }

  @Get('search')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Vyhledat zákazníky' })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  @Get(':id')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Detail zákazníka' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }
}
