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
import { TeachersService } from './teachers.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { QueryTeacherDto } from './dto/query-teacher.dto.js';
import { AssignSubjectsDto } from './dto/assign-subjects.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register/Create a new teacher (Admin only)' })
  @ApiResponse({ status: 201, description: 'Teacher registered successfully' })
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all teachers with search, filter & pagination' })
  @ApiResponse({ status: 200, description: 'Teachers list retrieved' })
  async findAll(@Query() query: QueryTeacherDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher details by ID' })
  @ApiResponse({ status: 200, description: 'Teacher details retrieved' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update teacher details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete teacher by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Teacher marked inactive' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign subjects to teacher (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subjects assigned successfully' })
  async assignSubjects(
    @Param('id') id: string,
    @Body() dto: AssignSubjectsDto,
  ) {
    return this.teachersService.assignSubjects(id, dto.subjectIds);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get weekly teaching schedule of a teacher' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getSchedule(@Param('id') id: string) {
    return this.teachersService.getSchedule(id);
  }
}
