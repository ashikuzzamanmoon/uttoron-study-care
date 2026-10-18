import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentMarkItemDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Marks obtained by student', example: 85 })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @ApiPropertyOptional({ description: 'Optional feedback or remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class SubmitBulkMarksDto {
  @ApiProperty({
    description: 'Array of student marks',
    type: [StudentMarkItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkItemDto)
  marks: StudentMarkItemDto[];

  @ApiPropertyOptional({
    description: 'Whether to publish the exam result immediately',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  publishImmediately?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to automatically send result SMS to guardians upon submission',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendResultSms?: boolean;
}
