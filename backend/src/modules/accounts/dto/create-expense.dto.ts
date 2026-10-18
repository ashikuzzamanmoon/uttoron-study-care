import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.RENT,
  })
  @IsEnum(ExpenseCategory, { message: 'সঠিক খরচের ক্যাটাগরি নির্বাচন করুন' })
  category!: ExpenseCategory;

  @ApiProperty({
    description: 'Expense description / detail',
    example: 'Office rent for January 2025',
  })
  @IsString()
  @IsNotEmpty({ message: 'খরচের বিবরণ প্রদান করা আবশ্যক' })
  description!: string;

  @ApiProperty({
    description: 'Expense amount in BDT',
    example: 12000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'খরচের পরিমাণ একটি সংখ্যা হতে হবে' })
  @Min(1, { message: 'খরচের পরিমাণ ১ টাকার বেশি হতে হবে' })
  amount!: number;

  @ApiPropertyOptional({
    description: 'Name of person or vendor paid to',
    example: 'Landlord / Rafiqul Islam',
  })
  @IsOptional()
  @IsString()
  paidTo?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'সঠিক পেমেন্ট পদ্ধতি নির্বাচন করুন' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Expense date (YYYY-MM-DD or ISO)',
    example: '2025-01-18',
  })
  @IsOptional()
  @IsDateString({}, { message: 'তারিখের ফরম্যাট সঠিক নয় (YYYY-MM-DD)' })
  expenseDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or remarks',
    example: 'Paid via check / voucher',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
