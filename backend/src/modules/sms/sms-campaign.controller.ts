import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SmsCampaignService } from './sms-campaign.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('SMS Campaigns')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms/campaigns')
export class SmsCampaignController {
  constructor(private readonly campaignService: SmsCampaignService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all SMS marketing campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved' })
  async getCampaigns(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.campaignService.getCampaigns(Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new SMS campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(dto);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload Excel/CSV contacts file for campaigns' })
  @ApiResponse({ status: 200, description: 'Contacts parsed' })
  async uploadContacts(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
        ],
      }),
    )
    file: { buffer: Buffer; originalname?: string },
  ) {
    return this.campaignService.uploadContacts(file);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get campaign details & recipient status' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  async getCampaignById(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Execute/Send campaign messages' })
  @ApiResponse({ status: 200, description: 'Campaign dispatched' })
  async executeCampaign(@Param('id') id: string) {
    return this.campaignService.executeCampaign(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignService.deleteCampaign(id);
  }
}
