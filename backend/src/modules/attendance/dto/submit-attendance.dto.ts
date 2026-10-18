import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordItemDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    enum: AttendanceStatus,
    description: 'Attendance status',
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Remarks or note', example: 'অসুস্থতার কারণে অনুপস্থিত' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class SubmitAttendanceDto {
  @ApiProperty({ description: 'Batch ID' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({
    description: 'Date of attendance (YYYY-MM-DD or ISO string)',
    example: '2026-10-18',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'List of student attendance records',
    type: [AttendanceRecordItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  records: AttendanceRecordItemDto[];

  @ApiPropertyOptional({
    description: 'Automatically trigger SMS for absent students upon submission',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendAbsentSms?: boolean;
}
