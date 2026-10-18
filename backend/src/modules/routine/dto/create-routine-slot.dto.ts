import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class CreateRoutineSlotDto {
  @ApiProperty({ description: 'ID of the batch' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

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
    description: 'Start time (HH:MM 24-hour format or standard string)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM (24-hour) format, e.g., 09:00, 14:30',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:MM 24-hour format or standard string)',
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
