import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QuerySummaryDto } from './dto/query-summary.dto.js';
import { FeeType, ExpenseCategory, PaymentMethod } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Get date boundaries for a given date
   */
  private getDayBoundaries(dateStr?: string) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) {
      throw new BadRequestException('তারিখের ফরম্যাট সঠিক নয়');
    }
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);

    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    return { start, end, dateString: start.toISOString().slice(0, 10) };
  }

  /**
   * 1. Daily Financial Summary
   */
  async getDailySummary(dateStr?: string) {
    const { start, end, dateString } = this.getDayBoundaries(dateStr);

    const [collections, expenses] = await Promise.all([
      this.prisma.feeCollection.findMany({
        where: {
          paymentDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          student: {
            select: {
              studentId: true,
              nameEn: true,
              nameBn: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { expenseDate: 'desc' },
      }),
    ]);

    const totalIncome = collections.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Payment methods breakdown for income
    const incomeByMethod: Record<string, number> = {};
    for (const c of collections) {
      incomeByMethod[c.paymentMethod] = (incomeByMethod[c.paymentMethod] || 0) + c.paidAmount;
    }

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    }

    return {
      date: dateString,
      kpis: {
        totalIncome,
        totalExpense,
        netBalance,
        totalTransactions: collections.length + expenses.length,
        feeCount: collections.length,
        expenseCount: expenses.length,
      },
      incomeByMethod,
      expenseByCategory,
      recentCollections: collections.slice(0, 10),
      recentExpenses: expenses.slice(0, 10),
    };
  }

  /**
   * 2. Monthly Financial Summary
   */
  async getMonthlySummary(targetMonth?: number, targetYear?: number) {
    const now = new Date();
    const year = Number(targetYear) || now.getFullYear();
    const month = Number(targetMonth) || now.getMonth() + 1; // 1-indexed (1 to 12)

    if (month < 1 || month > 12) {
      throw new BadRequestException('মাস অবশ্যই ১ থেকে ১২ এর মধ্যে হতে হবে');
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

    const [collections, expenses] = await Promise.all([
      this.prisma.feeCollection.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          feeType: true,
          paidAmount: true,
          paymentMethod: true,
          paymentDate: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          category: true,
          amount: true,
          paymentMethod: true,
          expenseDate: true,
        },
      }),
    ]);

    const totalIncome = collections.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Daily trend data points
    const dailyData: { day: number; date: string; income: number; expense: number; net: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayIncome = collections
        .filter((c) => new Date(c.paymentDate).getUTCDate() === day)
        .reduce((sum, c) => sum + c.paidAmount, 0);

      const dayExpense = expenses
        .filter((e) => new Date(e.expenseDate).getUTCDate() === day)
        .reduce((sum, e) => sum + e.amount, 0);

      dailyData.push({
        day,
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
      });
    }

    // Income breakdown by FeeType
    const incomeByFeeType: Record<string, number> = {};
    for (const c of collections) {
      incomeByFeeType[c.feeType] = (incomeByFeeType[c.feeType] || 0) + c.paidAmount;
    }

    // Expense breakdown by Category
    const expenseByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    }

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate);

    return {
      month,
      year,
      monthName: `${monthName} ${year}`,
      kpis: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) + '%' : '0%',
      },
      dailyData,
      incomeByFeeType,
      expenseByCategory,
    };
  }

  /**
   * 3. Yearly Financial Summary
   */
  async getYearlySummary(targetYear?: number) {
    const year = Number(targetYear) || new Date().getFullYear();

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const [collections, expenses] = await Promise.all([
      this.prisma.feeCollection.findMany({
        where: {
          paymentDate: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          paidAmount: true,
          paymentDate: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          amount: true,
          expenseDate: true,
        },
      }),
    ]);

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthlySummary = monthNames.map((name, index) => {
      const monthIncome = collections
        .filter((c) => new Date(c.paymentDate).getUTCMonth() === index)
        .reduce((sum, c) => sum + c.paidAmount, 0);

      const monthExpense = expenses
        .filter((e) => new Date(e.expenseDate).getUTCMonth() === index)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: index + 1,
        monthName: name,
        income: monthIncome,
        expense: monthExpense,
        netBalance: monthIncome - monthExpense,
      };
    });

    const totalAnnualIncome = monthlySummary.reduce((sum, m) => sum + m.income, 0);
    const totalAnnualExpense = monthlySummary.reduce((sum, m) => sum + m.expense, 0);
    const netAnnualProfit = totalAnnualIncome - totalAnnualExpense;

    return {
      year,
      kpis: {
        totalIncome: totalAnnualIncome,
        totalExpense: totalAnnualExpense,
        netProfit: netAnnualProfit,
        profitMargin:
          totalAnnualIncome > 0
            ? ((netAnnualProfit / totalAnnualIncome) * 100).toFixed(2) + '%'
            : '0%',
      },
      months: monthlySummary,
    };
  }

  /**
   * 4. Detailed Collection Analytics Report
   */
  async getCollectionReport(query: QuerySummaryDto) {
    const { startDate, endDate } = query;
    const where: any = {};

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const collections = await this.prisma.feeCollection.findMany({
      where,
      include: {
        student: {
          include: {
            batchStudents: {
              include: {
                batch: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalPaid = collections.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalDiscount = collections.reduce((acc, c) => acc + (c.discount || 0), 0);
    const totalDue = collections.reduce((acc, c) => acc + c.dueAmount, 0);

    // Grouping by FeeType
    const byFeeType: Record<string, { count: number; total: number }> = {};
    for (const c of collections) {
      if (!byFeeType[c.feeType]) byFeeType[c.feeType] = { count: 0, total: 0 };
      byFeeType[c.feeType].count += 1;
      byFeeType[c.feeType].total += c.paidAmount;
    }

    // Grouping by PaymentMethod
    const byPaymentMethod: Record<string, { count: number; total: number }> = {};
    for (const c of collections) {
      if (!byPaymentMethod[c.paymentMethod]) byPaymentMethod[c.paymentMethod] = { count: 0, total: 0 };
      byPaymentMethod[c.paymentMethod].count += 1;
      byPaymentMethod[c.paymentMethod].total += c.paidAmount;
    }

    // Grouping by Batch
    const byBatch: Record<string, { batchName: string; total: number; count: number }> = {};
    for (const c of collections) {
      const b = c.student.batchStudents[0]?.batch;
      const bId = b?.id || 'unassigned';
      const bName = b?.name || 'অন্যান্য';
      if (!byBatch[bId]) byBatch[bId] = { batchName: bName, total: 0, count: 0 };
      byBatch[bId].total += c.paidAmount;
      byBatch[bId].count += 1;
    }

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
      },
      summary: {
        totalRecords: collections.length,
        totalPaid,
        totalDiscount,
        totalDue,
      },
      byFeeType,
      byPaymentMethod,
      byBatch: Object.values(byBatch),
    };
  }

  /**
   * 5. Detailed Expense Analytics Report
   */
  async getExpenseReport(query: QuerySummaryDto) {
    const { startDate, endDate } = query;
    const where: any = {};

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });

    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Group by category
    const byCategory: Record<string, { count: number; total: number }> = {};
    for (const e of expenses) {
      if (!byCategory[e.category]) byCategory[e.category] = { count: 0, total: 0 };
      byCategory[e.category].count += 1;
      byCategory[e.category].total += e.amount;
    }

    // Group by payment method
    const byPaymentMethod: Record<string, { count: number; total: number }> = {};
    for (const e of expenses) {
      if (!byPaymentMethod[e.paymentMethod]) byPaymentMethod[e.paymentMethod] = { count: 0, total: 0 };
      byPaymentMethod[e.paymentMethod].count += 1;
      byPaymentMethod[e.paymentMethod].total += e.amount;
    }

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
      },
      summary: {
        totalRecords: expenses.length,
        totalExpense,
      },
      byCategory,
      byPaymentMethod,
    };
  }
}
