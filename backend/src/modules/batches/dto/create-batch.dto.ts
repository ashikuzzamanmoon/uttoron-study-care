import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: '১০ম শ্রেণি - ব্যাচ ক (বিজ্ঞান)', description: 'Batch name' })
  @IsNotEmpty({ message: 'Batch name is required' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Class 10', description: 'Class level' })
  @IsNotEmpty({ message: 'Class level is required' })
  @IsString()
  classLevel: string;

  @ApiPropertyOptional({ example: 'Science', description: 'Group (Science, Commerce, Arts, General)' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Section name (A, B, C)' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({ example: 2025, description: 'Academic year' })
  @IsNotEmpty({ message: 'Academic year is required' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ example: 40, description: 'Maximum students capacity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number = 40;

  @ApiPropertyOptional({ example: 2000, description: 'Monthly fee for this batch' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number = 0;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
