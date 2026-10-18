import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoticeDto {
  @ApiProperty({ description: 'Notice Title', example: 'আগামীকাল কোচিংয়ের সকল ক্লাস বন্ধ থাকবে' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notice Body Content', example: 'আসন্ন জাতীয় ছুটি উপলক্ষে আগামীকাল কোচিংয়ের সকল শাখা ও ক্লাস বন্ধ থাকবে।' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' })
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string = 'NORMAL';

  @ApiPropertyOptional({ description: 'Publish immediately?', default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @ApiPropertyOptional({ description: 'Expiration date (optional)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
