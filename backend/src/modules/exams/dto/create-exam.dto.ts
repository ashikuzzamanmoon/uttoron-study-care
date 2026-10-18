import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamType } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty({ description: 'Exam title', example: 'Monthly Exam October 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ExamType, description: 'Type of exam', example: ExamType.MONTHLY_EXAM })
  @IsEnum(ExamType)
  @IsNotEmpty()
  examType: ExamType;

  @ApiProperty({ description: 'Batch ID' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Teacher ID who is conducting or in charge' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ description: 'Date of exam (YYYY-MM-DD)', example: '2026-10-25' })
  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @ApiProperty({ description: 'Total / Full marks', example: 100, default: 100 })
  @IsInt()
  @Min(1)
  fullMarks: number;

  @ApiProperty({ description: 'Passing marks', example: 33, default: 33 })
  @IsInt()
  @Min(1)
  passMarks: number;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 60 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Syllabus / Topics covered in exam' })
  @IsString()
  @IsOptional()
  syllabus?: string;

  @ApiPropertyOptional({ description: 'Whether result is published to students/guardians', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
