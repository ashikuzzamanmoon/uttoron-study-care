import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service.js';
import { QuerySummaryDto } from './dto/query-summary.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Accounts & Financial Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'General summary router (daily or monthly)' })
  @ApiResponse({ status: 200, description: 'Summary data retrieved' })
  async getSummary(@Query() query: QuerySummaryDto) {
    if (query.date) {
      return this.accountsService.getDailySummary(query.date);
    }
    if (query.month || query.year) {
      return this.accountsService.getMonthlySummary(query.month, query.year);
    }
    return this.accountsService.getDailySummary();
  }

  @Get('summary/daily')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get daily income, expense & net balance summary' })
  @ApiResponse({ status: 200, description: 'Daily financial summary' })
  async getDailySummary(@Query('date') date?: string) {
    return this.accountsService.getDailySummary(date);
  }

  @Get('summary/monthly')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get monthly financial breakdown & daily trend points' })
  @ApiResponse({ status: 200, description: 'Monthly financial summary' })
  async getMonthlySummary(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.accountsService.getMonthlySummary(month, year);
  }

  @Get('summary/yearly')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get 12-month annual financial comparison' })
  @ApiResponse({ status: 200, description: 'Yearly financial summary' })
  async getYearlySummary(@Query('year') year?: number) {
    return this.accountsService.getYearlySummary(year);
  }

  @Get('collection-report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get fee collection analytics report' })
  @ApiResponse({ status: 200, description: 'Fee collection analytics' })
  async getCollectionReport(@Query() query: QuerySummaryDto) {
    return this.accountsService.getCollectionReport(query);
  }

  @Get('expense-report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get expense breakdown analytics report' })
  @ApiResponse({ status: 200, description: 'Expense analytics' })
  async getExpenseReport(@Query() query: QuerySummaryDto) {
    return this.accountsService.getExpenseReport(query);
  }
}
