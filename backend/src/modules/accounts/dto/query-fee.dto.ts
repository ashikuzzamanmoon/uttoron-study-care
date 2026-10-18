import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeeType, PaymentMethod } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryFeeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Student UUID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Batch UUID' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Fee Type', enum: FeeType })
  @IsOptional()
  @IsEnum(FeeType)
  feeType?: FeeType;

  @ApiPropertyOptional({ description: 'Filter by Month string, e.g. "January 2025"' })
  @IsOptional()
  @IsString()
  feeMonth?: string;

  @ApiPropertyOptional({ description: 'Filter by Payment Method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by Start Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by End Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
