import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class QueryRoutineDto {
  @ApiPropertyOptional({ description: 'Filter by Batch ID' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ enum: DayOfWeek, description: 'Filter by Day of week' })
  @IsEnum(DayOfWeek)
  @IsOptional()
  day?: DayOfWeek;

  @ApiPropertyOptional({ description: 'Filter by Teacher ID' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Filter by Subject ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by Classroom / Room No' })
  @IsString()
  @IsOptional()
  roomNo?: string;
}
