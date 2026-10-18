import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerAbsentSmsDto {
  @ApiPropertyOptional({
    description: 'Array of Attendance IDs to send absent alert SMS for',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendanceIds?: string[];

  @ApiPropertyOptional({ description: 'Batch ID if sending for entire batch date' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Date (YYYY-MM-DD) if sending for entire batch date' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Custom message override if not using default template' })
  @IsString()
  @IsOptional()
  customMessage?: string;
}
