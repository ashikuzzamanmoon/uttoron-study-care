import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({ description: 'Academic Year Name', example: '2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Start Date', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End Date', example: '2026-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Set as current active year', default: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean = false;
}
