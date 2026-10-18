import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMarkDto {
  @ApiPropertyOptional({ description: 'Obtained marks', example: 88 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  obtainedMarks?: number;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
