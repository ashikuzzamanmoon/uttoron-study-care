import {
  Controller,
  Get,
  Post,
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
import { FeesService } from './fees.service.js';
import { CollectFeeDto } from './dto/collect-fee.dto.js';
import { QueryFeeDto } from './dto/query-fee.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Fee Collection')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List all fee collections with filters & pagination' })
  @ApiResponse({ status: 200, description: 'List of fee collections' })
  async findAll(@Query() query: QueryFeeDto) {
    return this.feesService.findAll(query);
  }

  @Post('collect')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Collect fee from a student & auto-generate receipt' })
  @ApiResponse({ status: 201, description: 'Fee collected successfully with receipt' })
  async collectFee(
    @Body() dto: CollectFeeDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.collectFee(dto, user);
  }

  @Get('dues')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get list of students with outstanding dues' })
  @ApiResponse({ status: 200, description: 'Students due list retrieved' })
  async getDues(
    @Query('batchId') batchId?: string,
    @Query('month') month?: string,
  ) {
    return this.feesService.getDues(batchId, month);
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get fee collection history of a student' })
  @ApiResponse({ status: 200, description: 'Student fee history retrieved' })
  async getStudentFeeHistory(@Param('studentId') studentId: string) {
    return this.feesService.getStudentFeeHistory(studentId);
  }

  @Get('receipt/:id/print')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get structured printable money receipt data' })
  @ApiResponse({ status: 200, description: 'Printable receipt data retrieved' })
  async generateReceipt(@Param('id') id: string) {
    return this.feesService.generateReceipt(id);
  }

  @Post('receipt/:id/sms')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Send fee receipt confirmation SMS to guardian' })
  @ApiResponse({ status: 200, description: 'Receipt SMS sent' })
  async sendReceiptSms(@Param('id') id: string) {
    return this.feesService.sendReceiptSms(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get single fee collection record by ID' })
  @ApiResponse({ status: 200, description: 'Fee record details' })
  async findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }
}
