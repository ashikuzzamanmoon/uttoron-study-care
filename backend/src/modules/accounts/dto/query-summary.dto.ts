import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuerySummaryDto {
  @ApiPropertyOptional({ description: 'Specific Date for daily summary (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Month (1-12) for monthly summary', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;

  @ApiPropertyOptional({ description: 'Year for monthly or yearly summary', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ description: 'Start Date for custom range (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date for custom range (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
