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
import { NoticesService } from './notices.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';
import { QueryNoticeDto } from './dto/query-notice.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Notice Board')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notices with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Notices list retrieved' })
  async findAll(@Query() query: QueryNoticeDto) {
    return this.noticesService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active & published notices for widgets/banners' })
  @ApiResponse({ status: 200, description: 'Active notices retrieved' })
  async getActiveNotices(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.noticesService.getActiveNotices(parsedLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single notice by ID' })
  @ApiResponse({ status: 200, description: 'Notice details retrieved' })
  async findOne(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create and publish a new notice' })
  @ApiResponse({ status: 201, description: 'Notice created successfully' })
  async create(
    @Body() createNoticeDto: CreateNoticeDto,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.create(createNoticeDto, user);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an existing notice' })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Toggle publication status of a notice' })
  @ApiResponse({ status: 200, description: 'Notice publication toggled' })
  async togglePublish(
    @Param('id') id: string,
    @Body('isPublished') isPublished?: boolean,
  ) {
    return this.noticesService.togglePublish(id, isPublished);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notice by ID' })
  @ApiResponse({ status: 200, description: 'Notice deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
