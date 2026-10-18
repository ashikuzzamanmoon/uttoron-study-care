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
} from '@nestjs/swagger';
import { BatchesService } from './batches.service.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { UpdateBatchDto } from './dto/update-batch.dto.js';
import { QueryBatchDto } from './dto/query-batch.dto.js';
import { EnrollStudentsDto } from './dto/enroll-students.dto.js';
import { AssignBatchTeachersDto } from './dto/assign-batch-teachers.dto.js';
import { AssignBatchSubjectsDto } from './dto/assign-batch-subjects.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Batches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new batch (Admin only)' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  async create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all batches with search, filter & pagination' })
  @ApiResponse({ status: 200, description: 'Batches list retrieved' })
  async findAll(@Query() query: QueryBatchDto) {
    return this.batchesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch details by ID' })
  @ApiResponse({ status: 200, description: 'Batch details retrieved' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update batch details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete batch by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Batch marked inactive' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async remove(@Param('id') id: string) {
    return this.batchesService.remove(id);
  }

  @Post(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Enroll students into batch' })
  @ApiResponse({ status: 200, description: 'Students enrolled successfully' })
  async addStudents(
    @Param('id') id: string,
    @Body() dto: EnrollStudentsDto,
  ) {
    return this.batchesService.addStudents(id, dto.students);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Unenroll student from batch' })
  @ApiResponse({ status: 200, description: 'Student unenrolled successfully' })
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.batchesService.removeStudent(id, studentId);
  }

  @Post(':id/teachers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign teachers to batch' })
  @ApiResponse({ status: 200, description: 'Teachers assigned successfully' })
  async assignTeachers(
    @Param('id') id: string,
    @Body() dto: AssignBatchTeachersDto,
  ) {
    return this.batchesService.assignTeachers(id, dto.teachers);
  }

  @Post(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign subjects to batch' })
  @ApiResponse({ status: 200, description: 'Subjects assigned successfully' })
  async addSubjects(
    @Param('id') id: string,
    @Body() dto: AssignBatchSubjectsDto,
  ) {
    return this.batchesService.addSubjects(id, dto.subjectIds);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all enrolled students of a batch' })
  @ApiResponse({ status: 200, description: 'Enrolled students retrieved' })
  async getStudents(@Param('id') id: string) {
    return this.batchesService.getStudents(id);
  }

  @Get(':id/routine')
  @ApiOperation({ summary: 'Get routine timetable of a batch' })
  @ApiResponse({ status: 200, description: 'Routine timetable retrieved' })
  async getRoutine(@Param('id') id: string) {
    return this.batchesService.getRoutine(id);
  }
}
