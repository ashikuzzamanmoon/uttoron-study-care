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
import { RoutineService } from './routine.service.js';
import { CreateRoutineSlotDto } from './dto/create-routine-slot.dto.js';
import { UpdateRoutineSlotDto } from './dto/update-routine-slot.dto.js';
import { QueryRoutineDto } from './dto/query-routine.dto.js';
import { BulkRoutineSlotsDto } from './dto/bulk-routine-slots.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Routine')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routine')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get()
  @ApiOperation({ summary: 'Get all routine slots (filterable by batch, day, teacher, room)' })
  @ApiResponse({ status: 200, description: 'Routine slots retrieved' })
  async findAll(@Query() query: QueryRoutineDto) {
    return this.routineService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a routine slot with conflict validation (Admin only)' })
  @ApiResponse({ status: 201, description: 'Routine slot created' })
  @ApiResponse({ status: 400, description: 'Conflict detected (time/teacher/room overlap)' })
  async create(@Body() createDto: CreateRoutineSlotDto) {
    return this.routineService.create(createDto);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk create/replace routine slots for a batch (Admin only)' })
  @ApiResponse({ status: 200, description: 'Routine updated for batch' })
  async bulkSave(@Body() bulkDto: BulkRoutineSlotsDto) {
    return this.routineService.bulkSave(bulkDto);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get complete routine timetable for a specific batch' })
  @ApiResponse({ status: 200, description: 'Batch routine retrieved' })
  async findByBatch(@Param('batchId') batchId: string) {
    return this.routineService.findByBatch(batchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single routine slot by ID' })
  @ApiResponse({ status: 200, description: 'Routine slot retrieved' })
  async findOne(@Param('id') id: string) {
    return this.routineService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update routine slot with conflict check (Admin only)' })
  @ApiResponse({ status: 200, description: 'Routine slot updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoutineSlotDto,
  ) {
    return this.routineService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete routine slot (Admin only)' })
  @ApiResponse({ status: 200, description: 'Routine slot deleted' })
  async remove(@Param('id') id: string) {
    return this.routineService.remove(id);
  }
}
