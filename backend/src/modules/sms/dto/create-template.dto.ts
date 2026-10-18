import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SmsType } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template Name',
    example: 'অনুপস্থিতি নোটিফিকেশন',
  })
  @IsString()
  @IsNotEmpty({ message: 'টেমপ্লেটের নাম আবশ্যক' })
  name!: string;

  @ApiProperty({
    description: 'Template Body with placeholders like {{studentName}}, {{date}}',
    example: 'উত্তরণ স্টাডি কেয়ার: আপনার সন্তান {{studentName}} আজ ({{date}}) ক্লাসে অনুপস্থিত ছিল।',
  })
  @IsString()
  @IsNotEmpty({ message: 'টেমপ্লেট বডি আবশ্যক' })
  body!: string;

  @ApiPropertyOptional({
    description: 'SMS Type for this template',
    enum: SmsType,
    default: SmsType.TRANSACTIONAL,
  })
  @IsOptional()
  @IsEnum(SmsType)
  type?: SmsType;

  @ApiPropertyOptional({
    description: 'Is template active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
