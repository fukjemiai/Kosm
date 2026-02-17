import { Controller, Get, Post, Param, Body, Query, Res, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { CreateInvoiceFromBookingDto, RecordPaymentDto, ExportQueryDto } from './dto/billing.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post('invoices')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Vystavit doklad z dokončené rezervace' })
  createInvoice(@Body() dto: CreateInvoiceFromBookingDto, @CurrentUser() user: RequestUser) {
    return this.service.createFromBooking(dto, user.keycloakId);
  }

  @Post('payments')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.STAFF)
  @ApiOperation({ summary: 'Zaznamenat platbu' })
  recordPayment(@Body() dto: RecordPaymentDto, @CurrentUser() user: RequestUser) {
    return this.service.recordPayment(dto, user.keycloakId);
  }

  @Get('invoices/by-org/:orgId')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Doklady organizace' })
  findByOrg(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findInvoicesByOrganization(
      orgId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('invoices/:id')
  @Roles(AppRole.ORG_OWNER, AppRole.SALON_MANAGER, AppRole.ACCOUNTANT, AppRole.STAFF)
  @ApiOperation({ summary: 'Detail dokladu' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findInvoiceById(id);
  }

  @Get('export/:orgId')
  @Roles(AppRole.ORG_OWNER, AppRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Export dokladů (CSV/XLSX)' })
  async exportInvoices(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    if (query.format === 'xlsx') {
      const buffer = await this.service.exportXlsx(orgId, query.from, query.to);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=doklady_${query.from}_${query.to}.xlsx`);
      res.send(buffer);
    } else {
      const csv = await this.service.exportCsv(orgId, query.from, query.to);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=doklady_${query.from}_${query.to}.csv`);
      res.send(csv);
    }
  }
}
