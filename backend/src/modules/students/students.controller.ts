import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { QueryStudentDto } from './dto/query-student.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admit/Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all students with filtering, search & pagination' })
  @ApiResponse({ status: 200, description: 'Students list retrieved' })
  async findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student details by ID' })
  @ApiResponse({ status: 200, description: 'Student details retrieved' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update student details by ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete student by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Student marked inactive' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get attendance history of a student' })
  @ApiQuery({ name: 'month', required: false, description: 'Format: YYYY-MM' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved' })
  async getAttendanceHistory(
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    return this.studentsService.getAttendanceHistory(id, month);
  }

  @Get(':id/marks')
  @ApiOperation({ summary: 'Get exam marks history of a student' })
  @ApiResponse({ status: 200, description: 'Marks history retrieved' })
  async getMarksHistory(@Param('id') id: string) {
    return this.studentsService.getMarksHistory(id);
  }

  @Get(':id/fees')
  @ApiOperation({ summary: 'Get fee collection history of a student' })
  @ApiResponse({ status: 200, description: 'Fee history retrieved' })
  async getFeeHistory(@Param('id') id: string) {
    return this.studentsService.getFeeHistory(id);
  }
}
