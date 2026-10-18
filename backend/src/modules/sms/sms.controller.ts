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
import { SmsService } from './sms.service.js';
import {
  SendIndividualSmsDto,
  SendBatchSmsDto,
  SendCustomSmsDto,
} from './dto/send-sms.dto.js';
import { QuerySmsDto } from './dto/query-sms.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('SMS Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send SMS to individual recipient' })
  @ApiResponse({ status: 200, description: 'SMS dispatched' })
  async sendIndividual(@Body() dto: SendIndividualSmsDto) {
    return this.smsService.sendIndividual(dto);
  }

  @Post('send-batch/:batchId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send SMS announcement to all guardians in a batch' })
  @ApiResponse({ status: 200, description: 'Batch SMS dispatched' })
  async sendBatch(
    @Param('batchId') batchId: string,
    @Body() dto: SendBatchSmsDto,
  ) {
    return this.smsService.sendToBatch(batchId, dto.message);
  }

  @Post('send-custom')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send SMS to custom phone numbers list' })
  @ApiResponse({ status: 200, description: 'Custom SMS dispatched' })
  async sendCustom(@Body() dto: SendCustomSmsDto) {
    return this.smsService.sendToCustomNumbers(dto);
  }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List SMS sending history & logs' })
  @ApiResponse({ status: 200, description: 'SMS logs retrieved' })
  async getLogs(@Query() query: QuerySmsDto) {
    return this.smsService.getLogs(query);
  }

  @Get('balance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check SMS Gateway account balance' })
  @ApiResponse({ status: 200, description: 'Gateway balance retrieved' })
  async getBalance() {
    return this.smsService.getBalance();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get SMS statistics (today, all-time, failed)' })
  @ApiResponse({ status: 200, description: 'SMS statistics' })
  async getStats() {
    return this.smsService.getStats();
  }
}
