import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateTeacherDto {
  @ApiProperty({ example: 'Dr. Rafiqul Islam', description: 'Teacher name in English' })
  @IsNotEmpty({ message: 'Teacher name is required' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: 'ড. রফিকুল ইসলাম', description: 'Teacher name in Bangla' })
  @IsOptional()
  @IsString()
  nameBn?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1985-04-12' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'https://example.com/teacher.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ example: '01711223344', description: 'Contact phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'teacher@uttoron.edu.bd' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '19852691234567890' })
  @IsOptional()
  @IsString()
  nidNumber?: string;

  @ApiPropertyOptional({ example: 'Senior Lecturer' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'M.Sc in Physics, DU' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: 'Physics, Higher Math' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySalary?: number;

  @ApiPropertyOptional({ example: 'Mirpur, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['subject-uuid-1', 'subject-uuid-2'],
    description: 'Array of Subject IDs to assign',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];
}
