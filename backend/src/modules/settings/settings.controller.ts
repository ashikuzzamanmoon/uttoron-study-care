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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service.js';
import { AcademicYearService } from './academic-year.service.js';
import { BulkUpdateSettingsDto, SettingItemDto } from './dto/setting-item.dto.js';
import { CreateAcademicYearDto } from './dto/academic-year.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly academicYearService: AcademicYearService,
  ) {}

  // ==========================
  // GENERAL / KEY-VALUE SETTINGS
  // ==========================

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiQuery({ name: 'group', required: false })
  async getAll(@Query('group') group?: string) {
    return this.settingsService.getAll(group);
  }

  @Get('dictionary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get settings as key-value dictionary' })
  @ApiQuery({ name: 'group', required: false })
  async getDictionary(@Query('group') group?: string) {
    return this.settingsService.getDictionary(group);
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk update settings' })
  async bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings);
  }

  @Put('single')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update or create a single setting' })
  async updateSingle(@Body() dto: SettingItemDto) {
    return this.settingsService.update(dto.key, dto.value, dto.group, dto.description);
  }

  // ==========================
  // ACADEMIC YEARS
  // ==========================

  @Get('academic-years')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all academic years' })
  async getAcademicYears() {
    return this.academicYearService.findAll();
  }

  @Post('academic-years')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new academic year' })
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.academicYearService.create(dto);
  }

  @Patch('academic-years/:id/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set an academic year as current active year' })
  async setCurrentAcademicYear(@Param('id') id: string) {
    return this.academicYearService.setCurrent(id);
  }

  @Delete('academic-years/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an academic year' })
  async removeAcademicYear(@Param('id') id: string) {
    return this.academicYearService.remove(id);
  }
}
