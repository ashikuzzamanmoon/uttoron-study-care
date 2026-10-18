import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodGroup } from '@prisma/client';

export class CreateStudentDto {
  // Personal Info
  @ApiProperty({ example: 'Tanvir Ahmed', description: 'Student name in English' })
  @IsNotEmpty({ message: 'English name is required' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: 'তানভীর আহমেদ', description: 'Student name in Bangla' })
  @IsOptional()
  @IsString()
  nameBn?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(Gender, { message: 'Invalid gender' })
  gender: Gender;

  @ApiPropertyOptional({ example: '2008-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.B_POSITIVE })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'tanvir@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  // Academic Info
  @ApiPropertyOptional({ example: 'Motijheel Ideal School and College' })
  @IsOptional()
  @IsString()
  instituteName?: string;

  @ApiProperty({ example: 'Class 10' })
  @IsNotEmpty({ message: 'Class level is required' })
  @IsString()
  classLevel: string;

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: '104521' })
  @IsOptional()
  @IsString()
  boardRollNo?: string;

  // Guardian Info
  @ApiProperty({ example: 'Md. Rafiqul Islam' })
  @IsNotEmpty({ message: 'Father name is required' })
  @IsString()
  fatherName: string;

  @ApiPropertyOptional({ example: '01812345678' })
  @IsOptional()
  @IsString()
  fatherPhone?: string;

  @ApiPropertyOptional({ example: 'Nasima Begum' })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({ example: '01912345678' })
  @IsOptional()
  @IsString()
  motherPhone?: string;

  @ApiPropertyOptional({ example: 'Md. Rafiqul Islam' })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({ example: '01812345678', description: 'Primary contact for SMS alerts' })
  @IsNotEmpty({ message: 'Guardian phone is required for SMS' })
  @IsString()
  guardianPhone: string;

  @ApiPropertyOptional({ example: 'Father' })
  @IsOptional()
  @IsString()
  guardianRelation?: string;

  // Address
  @ApiPropertyOptional({ example: 'House 12, Road 4, Dhanmondi, Dhaka' })
  @IsOptional()
  @IsString()
  presentAddress?: string;

  @ApiPropertyOptional({ example: 'Village: Rupganj, Narayanganj' })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  // Admission & Fees
  @ApiPropertyOptional({ example: '2025-01-10' })
  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  admissionFee?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED'] })
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Batch Enrollment (Optional initial batch)
  @ApiPropertyOptional({ example: 'batch-uuid-here', description: 'Initial batch ID to enroll' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Roll number in batch' })
  @IsOptional()
  @IsNumber()
  rollNumber?: number;
}
