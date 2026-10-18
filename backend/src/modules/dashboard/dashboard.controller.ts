import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('quick-stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get core KPI summary statistics' })
  @ApiResponse({ status: 200, description: 'Quick stats retrieved successfully' })
  async getQuickStats() {
    return this.dashboardService.getQuickStats();
  }

  @Get('charts/monthly-income')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get 12-month income vs expense chart dataset' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getMonthlyIncomeChart(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.dashboardService.getMonthlyIncomeChart(targetYear);
  }

  @Get('charts/attendance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get attendance trends and distribution' })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiQuery({ name: 'month', required: false, type: String })
  async getAttendanceChart(
    @Query('batchId') batchId?: string,
    @Query('month') month?: string,
  ) {
    return this.dashboardService.getAttendanceChart(batchId, month);
  }

  @Get('charts/expense-categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get annual expense category breakdown' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getExpenseCategories(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.dashboardService.getExpenseCategoryChart(undefined, targetYear);
  }

  @Get('recent-activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get combined recent activities timeline feed' })
  async getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('upcoming-exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get upcoming exams schedule' })
  async getUpcomingExams() {
    return this.dashboardService.getUpcomingExams();
  }

  @Get('due-alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get students with highest outstanding fees' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDueAlerts(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 6;
    return this.dashboardService.getDueAlerts(parsedLimit);
  }
}
