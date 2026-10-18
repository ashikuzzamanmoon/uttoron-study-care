import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SmsType } from '@prisma/client';

export class SendIndividualSmsDto {
  @ApiProperty({
    description: 'Target phone number (e.g. 01712345678 or 8801712345678)',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'মোবাইল নম্বর প্রদান করা আবশ্যক' })
  phone!: string;

  @ApiProperty({
    description: 'SMS message text',
    example: 'উত্তরণ স্টাডি কেয়ার: আপনার সন্তানের ক্লাস আজ বিকাল ৪টায়।',
  })
  @IsString()
  @IsNotEmpty({ message: 'এসএমএস টেক্সট প্রদান করা আবশ্যক' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Associated student ID (optional)',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'SMS Type',
    enum: SmsType,
    default: SmsType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(SmsType)
  type?: SmsType;
}

export class SendBatchSmsDto {
  @ApiProperty({
    description: 'Batch UUID',
    example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsNotEmpty({ message: 'ব্যাচ আইডি প্রদান করা আবশ্যক' })
  batchId!: string;

  @ApiProperty({
    description: 'SMS message text to send to all guardians in this batch',
    example: 'উত্তরণ স্টাডি কেয়ার: আগামীকাল ব্যাচ এ-এর পদার্থবিজ্ঞান ক্লাস সকাল ৯টায় অনুষ্ঠিত হবে।',
  })
  @IsString()
  @IsNotEmpty({ message: 'এসএমএস টেক্সট প্রদান করা আবশ্যক' })
  message!: string;
}

export class SendCustomSmsDto {
  @ApiProperty({
    description: 'Array of custom phone numbers',
    example: ['01711111111', '01822222222'],
  })
  @IsArray({ message: 'মোবাইল নম্বর একটি অ্যারে হতে হবে' })
  @ArrayMinSize(1, { message: 'কমপক্ষে একটি মোবাইল নম্বর দিন' })
  @IsString({ each: true })
  phones!: string[];

  @ApiProperty({
    description: 'SMS message text',
    example: 'উত্তরণ স্টাডি কেয়ার: বিশেষ ফ্রি ক্লাস শুক্রবার সকাল ১০টায়।',
  })
  @IsString()
  @IsNotEmpty({ message: 'এসএমএস টেক্সট প্রদান করা আবশ্যক' })
  message!: string;
}
