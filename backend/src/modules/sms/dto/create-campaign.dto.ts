import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CampaignRecipientDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'Rahim' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'student-uuid' })
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign Name',
    example: 'Free Physics Workshop - November 2024',
  })
  @IsString()
  @IsNotEmpty({ message: 'ক্যাম্পেইনের নাম আবশ্যক' })
  name!: string;

  @ApiProperty({
    description: 'Campaign Message Body',
    example: 'উত্তরণ স্টাডি কেয়ার: ফ্রি পদার্থবিজ্ঞান ওয়ার্কশপে অংশ নিতে রেজিস্ট্রেশন করুন। হটলাইন: ০১৭০০-০০০০০০',
  })
  @IsString()
  @IsNotEmpty({ message: 'ক্যাম্পেইন মেসেজ বডি আবশ্যক' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Optional scheduled sending time',
    example: '2025-02-01T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Recipients list (if not uploaded via Excel)',
    type: [CampaignRecipientDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignRecipientDto)
  recipients?: CampaignRecipientDto[];
}
