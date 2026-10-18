import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExamType } from '@prisma/client';

export class QueryExamDto {
  @ApiPropertyOptional({ description: 'Filter by Batch ID' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Subject ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ enum: ExamType, description: 'Filter by Exam Type' })
  @IsEnum(ExamType)
  @IsOptional()
  examType?: ExamType;

  @ApiPropertyOptional({ description: 'Filter by published status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Search by exam name or syllabus' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
