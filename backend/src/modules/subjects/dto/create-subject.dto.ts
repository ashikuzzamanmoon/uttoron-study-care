import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'পদার্থবিজ্ঞান', description: 'Name of the subject' })
  @IsNotEmpty({ message: 'Subject name is required' })
  @IsString({ message: 'Subject name must be a string' })
  name: string;

  @ApiProperty({ example: 'PHY', description: 'Unique code for the subject' })
  @IsNotEmpty({ message: 'Subject code is required' })
  @IsString({ message: 'Subject code must be a string' })
  code: string;

  @ApiPropertyOptional({ example: 'Class 10', description: 'Class level' })
  @IsOptional()
  @IsString()
  classLevel?: string;

  @ApiPropertyOptional({ example: 'Science', description: 'Subject group (Science, Commerce, Arts)' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ default: 100, description: 'Full marks' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  fullMarks?: number = 100;

  @ApiPropertyOptional({ default: 33, description: 'Pass marks' })
  @IsOptional()
  @IsInt()
  @Min(0)
  passMarks?: number = 33;

  @ApiPropertyOptional({ default: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
