import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SmsType, SmsStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QuerySmsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by SMS Type', enum: SmsType })
  @IsOptional()
  @IsEnum(SmsType)
  type?: SmsType;

  @ApiPropertyOptional({ description: 'Filter by SMS Status', enum: SmsStatus })
  @IsOptional()
  @IsEnum(SmsStatus)
  status?: SmsStatus;

  @ApiPropertyOptional({ description: 'Filter by Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Filter Start Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter End Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
