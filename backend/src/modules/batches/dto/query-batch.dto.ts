import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryBatchDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by class level (e.g. Class 10)' })
  @IsOptional()
  @IsString()
  classLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by group (e.g. Science)' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Filter by academic year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
