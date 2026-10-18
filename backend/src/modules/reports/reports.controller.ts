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
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Reports Hub')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: '1. Students report (Batch-wise or institute-wide)' })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'classLevel', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getStudentsReport(
    @Query('batchId') batchId?: string,
    @Query('classLevel') classLevel?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getStudentsReport(batchId, classLevel, status);
  }

  @Get('attendance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: '2. Monthly attendance summary sheet for a batch' })
  @ApiQuery({ name: 'batchId', required: true })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getAttendanceReport(
    @Query('batchId') batchId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getAttendanceReport(batchId, m, y);
  }

  @Get('exam-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: '3. Exam results and batch merit list' })
  @ApiQuery({ name: 'examId', required: true })
  async getExamResultsReport(@Query('examId') examId: string) {
    return this.reportsService.getExamResultsReport(examId);
  }

  @Get('fee-collections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: '4. Fee collections breakdown report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'feeMonth', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  async getFeeCollectionsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('feeMonth') feeMonth?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.reportsService.getFeeCollectionsReport(startDate, endDate, feeMonth, paymentMethod);
  }

  @Get('dues')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: '5. Outstanding fee dues report' })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'month', required: false })
  async getDuesReport(
    @Query('batchId') batchId?: string,
    @Query('month') month?: string,
  ) {
    return this.reportsService.getDuesReport(batchId, month);
  }

  @Get('income-expense')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: '6. Income & Expense balance sheet report' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getIncomeExpenseReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : undefined;
    return this.reportsService.getIncomeExpenseReport(y, m);
  }

  @Get('sms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '7. SMS delivery & expenditure report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getSmsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getSmsReport(startDate, endDate, type, status);
  }
}
