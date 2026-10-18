import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QuerySubjectDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by class level' })
  @IsOptional()
  @IsString()
  classLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by group (e.g. Science, Commerce, Arts)' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
