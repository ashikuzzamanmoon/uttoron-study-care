import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeeType, PaymentMethod } from '@prisma/client';

export class CollectFeeDto {
  @ApiProperty({
    description: 'Student UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsNotEmpty({ message: 'শিক্ষার্থীর আইডি প্রদান করা আবশ্যক' })
  studentId!: string;

  @ApiPropertyOptional({
    description: 'Fee type',
    enum: FeeType,
    default: FeeType.MONTHLY_FEE,
  })
  @IsOptional()
  @IsEnum(FeeType, { message: 'সঠিক ফি এর ধরন নির্বাচন করুন' })
  feeType?: FeeType;

  @ApiPropertyOptional({
    description: 'Fee Month (e.g. "January 2025")',
    example: 'January 2025',
  })
  @IsOptional()
  @IsString()
  feeMonth?: string;

  @ApiProperty({
    description: 'Original fee amount before discount/fine',
    example: 1500,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'নির্ধারিত ফি অবশ্যই একটি সংখ্যা হতে হবে' })
  @Min(0, { message: 'নির্ধারিত ফি ০ বা তার বেশি হতে হবে' })
  amount!: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 200,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ছাড়ের পরিমাণ সংখ্যা হতে হবে' })
  @Min(0, { message: 'ছাড় ০ বা তার বেশি হতে হবে' })
  discount?: number;

  @ApiPropertyOptional({
    description: 'Late fee or fine amount',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'জরিমানা অবশ্যই একটি সংখ্যা হতে হবে' })
  @Min(0, { message: 'জরিমানা ০ বা তার বেশি হতে হবে' })
  fine?: number;

  @ApiProperty({
    description: 'Actual amount paid now',
    example: 1300,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'পরিশোধের পরিমাণ সংখ্যা হতে হবে' })
  @Min(0, { message: 'পরিশোধিত টাকা ০ বা তার বেশি হতে হবে' })
  paidAmount!: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'সঠিক পেমেন্ট পদ্ধতি নির্বাচন করুন' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Transaction ID for digital payments',
    example: 'TRX98273645',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment date (YYYY-MM-DD or ISO)',
    example: '2025-01-18',
  })
  @IsOptional()
  @IsDateString({}, { message: 'পেমেন্টের তারিখ সঠিক ফরম্যাটে দিন (YYYY-MM-DD)' })
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Remarks / notes',
    example: 'Paid in cash with receipt',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Whether to trigger SMS confirmation to guardian',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;
}
