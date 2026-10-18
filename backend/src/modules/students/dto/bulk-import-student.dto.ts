import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodGroup } from '@prisma/client';

export class BulkStudentItemDto {
  @ApiProperty({ example: 'Tanvir Ahmed' })
  @IsNotEmpty({ message: 'Name in English is required' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: 'তানভীর আহমেদ' })
  @IsOptional()
  @IsString()
  nameBn?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Class 10' })
  @IsOptional()
  @IsString()
  classLevel?: string;

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: 'Md. Rafiqul Islam' })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional({ example: '01812345678' })
  @IsOptional()
  @IsString()
  fatherPhone?: string;

  @ApiPropertyOptional({ example: 'Nasima Begum' })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiProperty({ example: '01812345678' })
  @IsNotEmpty({ message: 'Guardian phone is required' })
  @IsString()
  guardianPhone: string;

  @ApiPropertyOptional({ example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Dhanmondi, Dhaka' })
  @IsOptional()
  @IsString()
  presentAddress?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  admissionFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  rollNumber?: number;
}

export class BulkImportStudentDto {
  @ApiProperty({ type: [BulkStudentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStudentItemDto)
  students: BulkStudentItemDto[];

  @ApiPropertyOptional({
    description: 'Optional default batch ID to assign to all imported students',
  })
  @IsOptional()
  @IsString()
  defaultBatchId?: string;
}
