import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingItemDto {
  @ApiProperty({ description: 'Setting Key', example: 'institute_name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Setting Value', example: 'উত্তরণ স্টাডি কেয়ার' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Group', example: 'institute' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({ type: [SettingItemDto], description: 'List of settings to upsert' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings: SettingItemDto[];
}
