import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
import { AttendanceService } from './attendance.service.js';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { TriggerAbsentSmsDto } from './dto/trigger-sms.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'List attendance records with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Attendance records list retrieved' })
  async findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Post('batch/:batchId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Submit or update attendance for an entire batch' })
  @ApiResponse({ status: 200, description: 'Batch attendance saved successfully' })
  async submitBatchAttendance(
    @Param('batchId') batchId: string,
    @Body() dto: SubmitAttendanceDto,
    @CurrentUser() user: any,
  ) {
    dto.batchId = batchId;
    return this.attendanceService.submitBatchAttendance(dto, user);
  }

  @Get('batch/:batchId/date/:date')
  @ApiOperation({ summary: 'Get attendance records for a batch on specific date' })
  @ApiResponse({ status: 200, description: 'Batch attendance retrieved' })
  async getBatchAttendance(
    @Param('batchId') batchId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.getBatchAttendance(batchId, date);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get attendance history of a specific student' })
  @ApiResponse({ status: 200, description: 'Student attendance history retrieved' })
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, startDate, endDate);
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate monthly attendance report for a batch' })
  @ApiQuery({ name: 'batchId', required: true })
  @ApiQuery({ name: 'month', required: true, example: 10 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiResponse({ status: 200, description: 'Attendance report generated' })
  async getAttendanceReport(
    @Query('batchId') batchId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.attendanceService.getAttendanceReport(batchId, month, year);
  }

  @Post('trigger-sms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Trigger absent notification SMS to guardians' })
  @ApiResponse({ status: 200, description: 'Absent SMS triggered' })
  async triggerAbsentSms(@Body() dto: TriggerAbsentSmsDto) {
    return this.attendanceService.triggerAbsentSms(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single attendance record by ID' })
  @ApiResponse({ status: 200, description: 'Attendance record retrieved' })
  async findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update single attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance record updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, dto);
  }
}
