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
import { SmsTemplateService } from './sms-template.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SmsType, UserRole } from '@prisma/client';

@ApiTags('SMS Templates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms/templates')
export class SmsTemplateController {
  constructor(private readonly templateService: SmsTemplateService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all SMS templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved' })
  async findAll(@Query('type') type?: SmsType) {
    return this.templateService.findAll(type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new SMS template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async create(@Body() dto: CreateTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get single SMS template by ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  async findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update SMS template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete SMS template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }
}
