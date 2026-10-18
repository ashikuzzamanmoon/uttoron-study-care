import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class RoutineSlotItemDto {
  @ApiPropertyOptional({ description: 'Existing slot ID if updating' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ description: 'ID of the subject' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'ID of the teacher' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({
    enum: DayOfWeek,
    description: 'Day of the week',
    example: DayOfWeek.SATURDAY,
  })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day: DayOfWeek;

  @ApiProperty({
    description: 'Start time (HH:MM 24-hour format)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM (24-hour) format, e.g., 09:00, 14:30',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:MM 24-hour format)',
    example: '10:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM (24-hour) format, e.g., 10:00, 15:30',
  })
  endTime: string;

  @ApiPropertyOptional({ description: 'Classroom / Room number or name', example: 'Room 101' })
  @IsString()
  @IsOptional()
  roomNo?: string;
}

export class BulkRoutineSlotsDto {
  @ApiProperty({ description: 'Batch ID to apply routine slots to' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({
    description: 'Array of routine slot items',
    type: [RoutineSlotItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineSlotItemDto)
  slots: RoutineSlotItemDto[];
}
