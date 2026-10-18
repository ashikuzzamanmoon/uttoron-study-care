import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MarksService } from './marks.service.js';
import { SubmitBulkMarksDto } from './dto/submit-marks.dto.js';
import { UpdateMarkDto } from './dto/update-mark.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Marks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marks')
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Get('exam/:examId')
  @ApiOperation({ summary: 'Get all student marks for an exam (roster view)' })
  @ApiResponse({ status: 200, description: 'Exam marks roster retrieved' })
  async getMarksByExam(@Param('examId') examId: string) {
    return this.marksService.getMarksByExam(examId);
  }

  @Post('exam/:examId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Bulk submit/update marks for an exam' })
  @ApiResponse({ status: 200, description: 'Marks submitted successfully' })
  async submitBulkMarks(
    @Param('examId') examId: string,
    @Body() dto: SubmitBulkMarksDto,
  ) {
    return this.marksService.submitBulkMarks(examId, dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a single student mark' })
  @ApiResponse({ status: 200, description: 'Mark updated successfully' })
  async updateSingleMark(
    @Param('id') id: string,
    @Body() dto: UpdateMarkDto,
  ) {
    return this.marksService.updateSingleMark(id, dto);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all marks and exam history of a specific student' })
  @ApiResponse({ status: 200, description: 'Student marks retrieved' })
  async getStudentMarks(@Param('studentId') studentId: string) {
    return this.marksService.getStudentMarks(studentId);
  }

  @Get('result/:examId')
  @ApiOperation({ summary: 'Get complete exam result sheet with merit rank list' })
  @ApiResponse({ status: 200, description: 'Result sheet retrieved' })
  async getResultSheet(@Param('examId') examId: string) {
    return this.marksService.getResultSheet(examId);
  }

  @Get('result-card/:studentId/:examId')
  @ApiOperation({ summary: 'Get individual result card with rank and batch stats' })
  @ApiResponse({ status: 200, description: 'Student result card retrieved' })
  async getStudentResultCard(
    @Param('studentId') studentId: string,
    @Param('examId') examId: string,
  ) {
    return this.marksService.getStudentResultCard(studentId, examId);
  }

  @Post('exam/:examId/trigger-sms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Send exam result SMS to guardians' })
  @ApiResponse({ status: 200, description: 'Result SMS dispatched' })
  async triggerResultSms(@Param('examId') examId: string) {
    return this.marksService.triggerResultSms(examId);
  }
}
