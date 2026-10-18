import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { ExamsService } from './exams.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { QueryExamDto } from './dto/query-exam.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all exams with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Exams list retrieved' })
  async findAll(@Query() query: QueryExamDto) {
    return this.examsService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  async create(
    @Body() createExamDto: CreateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.create(createExamDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam details by ID with statistics' })
  @ApiResponse({ status: 200, description: 'Exam details retrieved' })
  async findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update exam details' })
  @ApiResponse({ status: 200, description: 'Exam updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete exam by ID' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish or unpublish exam results' })
  @ApiResponse({ status: 200, description: 'Exam publish status toggled' })
  async togglePublish(
    @Param('id') id: string,
    @Body('isPublished') isPublished?: boolean,
  ) {
    return this.examsService.togglePublish(id, isPublished);
  }
}
