import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpenseDto } from './dto/query-expense.dto.js';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate sequential voucher number: EXP-YYYY-NNNN
   */
  private async generateVoucherNo(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EXP-${currentYear}-`;

    const latest = await this.prisma.expense.findFirst({
      where: {
        voucherNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        voucherNo: 'desc',
      },
      select: {
        voucherNo: true,
      },
    });

    let sequence = 1;
    if (latest?.voucherNo) {
      const parts = latest.voucherNo.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          sequence = lastNum + 1;
        }
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create an expense entry
   */
  async create(dto: CreateExpenseDto) {
    let voucherNo = await this.generateVoucherNo();
    const existing = await this.prisma.expense.findUnique({
      where: { voucherNo },
    });
    if (existing) {
      const fallbackSeq = Math.floor(1000 + Math.random() * 9000);
      voucherNo = `EXP-${new Date().getFullYear()}-${fallbackSeq}`;
    }

    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : new Date();

    const expense = await this.prisma.expense.create({
      data: {
        voucherNo,
        category: dto.category,
        description: dto.description,
        amount: Number(dto.amount),
        paidTo: dto.paidTo || null,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        expenseDate,
        remarks: dto.remarks || null,
      },
    });

    return {
      message: 'ব্যয় সফলভাবে এন্ট্রি করা হয়েছে',
      data: expense,
    };
  }

  /**
   * List all expenses with filters and pagination
   */
  async findAll(query: QueryExpenseDto) {
    const {
      page = 1,
      limit = 20,
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { voucherNo: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { paidTo: { contains: term, mode: 'insensitive' } },
        { remarks: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, records, aggregations] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
      summary: {
        totalExpense: aggregations._sum.amount || 0,
      },
      data: records,
    };
  }

  /**
   * Get single expense by ID
   */
  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`ভাউচার আইডি '${id}' পাওয়া যায়নি`);
    }

    return expense;
  }

  /**
   * Update an expense
   */
  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.amount !== undefined) {
      data.amount = Number(dto.amount);
    }
    if (dto.expenseDate) {
      data.expenseDate = new Date(dto.expenseDate);
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data,
    });

    return {
      message: 'ব্যয় সফলভাবে আপডেট করা হয়েছে',
      data: updated,
    };
  }

  /**
   * Delete an expense
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.expense.delete({
      where: { id },
    });

    return {
      message: 'ব্যয় সফলভাবে মুছে ফেলা হয়েছে',
    };
  }

  /**
   * List of Expense categories with labels
   */
  getCategories() {
    return [
      { key: ExpenseCategory.SALARY, labelBn: 'শিক্ষক/স্টাফ বেতন', labelEn: 'Salary' },
      { key: ExpenseCategory.RENT, labelBn: 'অফিস/রুম ভাড়া', labelEn: 'Rent' },
      { key: ExpenseCategory.ELECTRICITY, labelBn: 'বিদ্যুৎ বিল', labelEn: 'Electricity' },
      { key: ExpenseCategory.INTERNET, labelBn: 'ইন্টারনেট বিল', labelEn: 'Internet' },
      { key: ExpenseCategory.STATIONERY, labelBn: 'স্টেশনারি ও খাতা-কলম', labelEn: 'Stationery' },
      { key: ExpenseCategory.FURNITURE, labelBn: 'আসবাবপত্র ও সরঞ্জাম', labelEn: 'Furniture' },
      { key: ExpenseCategory.MARKETING, labelBn: 'বিজ্ঞাপন ও প্রচার', labelEn: 'Marketing' },
      { key: ExpenseCategory.SMS_RECHARGE, labelBn: 'এসএমএস রিচার্জ', labelEn: 'SMS Recharge' },
      { key: ExpenseCategory.MAINTENANCE, labelBn: 'মেরামত ও রক্ষণাবেক্ষণ', labelEn: 'Maintenance' },
      { key: ExpenseCategory.OTHER, labelBn: 'অন্যান্য খরচ', labelEn: 'Other' },
    ];
  }
}
