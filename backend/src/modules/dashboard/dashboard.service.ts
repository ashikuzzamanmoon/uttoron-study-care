import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get KPI quick statistics for dashboard summary cards
   */
  async getQuickStats() {
    const now = new Date();

    // Start and end of today (UTC aligned)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Start and end of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalStudents,
      totalTeachers,
      totalBatches,
      todayIncomeAgg,
      todayExpenseAgg,
      thisMonthIncomeAgg,
      thisMonthExpenseAgg,
      totalDuesAgg,
      todaySmsCount,
      todayAttendanceRecords,
    ] = await Promise.all([
      // 1. Total active students
      this.prisma.student.count({
        where: { isActive: true },
      }),
      // 2. Total active teachers
      this.prisma.teacher.count({
        where: { isActive: true },
      }),
      // 3. Total active batches
      this.prisma.batch.count({
        where: { isActive: true },
      }),
      // 4. Today's income
      this.prisma.feeCollection.aggregate({
        where: {
          paymentDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: { paidAmount: true },
      }),
      // 5. Today's expense
      this.prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: { amount: true },
      }),
      // 6. This month's income
      this.prisma.feeCollection.aggregate({
        where: {
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { paidAmount: true },
      }),
      // 7. This month's expense
      this.prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { amount: true },
      }),
      // 8. Total outstanding dues
      this.prisma.feeCollection.aggregate({
        where: {
          dueAmount: { gt: 0 },
        },
        _sum: { dueAmount: true },
      }),
      // 9. Today's SMS count
      this.prisma.smsLog.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: 'SENT',
        },
      }),
      // 10. Today's attendance
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: { status: true },
      }),
    ]);

    const totalTodayAttendance = todayAttendanceRecords.length;
    const presentTodayCount = todayAttendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendanceRateToday =
      totalTodayAttendance > 0
        ? Math.round((presentTodayCount / totalTodayAttendance) * 100)
        : 0;

    return {
      totalStudents,
      totalTeachers,
      totalBatches,
      todayIncome: todayIncomeAgg._sum.paidAmount || 0,
      todayExpense: todayExpenseAgg._sum.amount || 0,
      thisMonthIncome: thisMonthIncomeAgg._sum.paidAmount || 0,
      thisMonthExpense: thisMonthExpenseAgg._sum.amount || 0,
      totalDues: totalDuesAgg._sum.dueAmount || 0,
      todaySmsCount,
      todayAttendance: {
        total: totalTodayAttendance,
        present: presentTodayCount,
        absent: totalTodayAttendance - presentTodayCount,
        rate: attendanceRateToday,
      },
    };
  }

  /**
   * Get 12-month annual income vs expense chart data
   */
  async getMonthlyIncomeChart(targetYear?: number) {
    const year = targetYear || new Date().getFullYear();

    const monthNamesEn = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthNamesBn = [
      'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে',
    ];

    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const [collections, expenses] = await Promise.all([
      this.prisma.feeCollection.findMany({
        where: {
          paymentDate: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          paymentDate: true,
          paidAmount: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          expenseDate: true,
          amount: true,
        },
      }),
    ]);

    // Build monthly buckets
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      nameEn: monthNamesEn[index],
      nameBn: monthNamesBn[index],
      income: 0,
      expense: 0,
      netProfit: 0,
    }));

    for (const c of collections) {
      const monthIdx = new Date(c.paymentDate).getMonth();
      monthlyData[monthIdx].income += c.paidAmount;
    }

    for (const e of expenses) {
      const monthIdx = new Date(e.expenseDate).getMonth();
      monthlyData[monthIdx].expense += e.amount;
    }

    for (const m of monthlyData) {
      m.netProfit = m.income - m.expense;
    }

    return {
      year,
      months: monthlyData,
    };
  }

  /**
   * Get attendance analytics and distribution
   */
  async getAttendanceChart(batchId?: string, month?: string) {
    const now = new Date();
    // Default to last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      date: { gte: thirtyDaysAgo },
    };

    if (batchId) {
      whereClause.batchId = batchId;
    }

    const attendances = await this.prisma.attendance.findMany({
      where: whereClause,
      select: {
        date: true,
        status: true,
        batch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const att of attendances) {
      if (counts[att.status] !== undefined) {
        counts[att.status]++;
      }
    }

    const total = attendances.length;
    const presentRate = total > 0 ? Math.round(((counts.PRESENT + counts.LATE) / total) * 100) : 0;

    // Daily trend for the last 7 distinct dates
    const dateMap = new Map<string, { date: string; present: number; absent: number; total: number }>();
    for (const a of attendances) {
      const dStr = a.date.toISOString().split('T')[0];
      if (!dateMap.has(dStr)) {
        dateMap.set(dStr, { date: dStr, present: 0, absent: 0, total: 0 });
      }
      const entry = dateMap.get(dStr)!;
      entry.total++;
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        entry.present++;
      } else {
        entry.absent++;
      }
    }

    const dailyTrend = Array.from(dateMap.values()).slice(-7);

    return {
      total,
      presentRate,
      distribution: counts,
      dailyTrend,
    };
  }

  /**
   * Get expense category breakdown for pie / doughnut chart
   */
  async getExpenseCategoryChart(month?: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const categoryNamesBn: Record<string, string> = {
      SALARY: 'শিক্ষক ও স্টাফ বেতন',
      RENT: 'অফিস/কোচিং ভাড়া',
      ELECTRICITY: 'বিদ্যুৎ বিল',
      INTERNET: 'ইন্টারনেট ও ইউটিলিটি',
      STATIONERY: 'খাতা, পেন ও প্রিন্টিং',
      FURNITURE: 'আসবাবপত্র ও ডেকোরেশন',
      MARKETING: 'প্রচার ও লিফলেট',
      SMS_RECHARGE: 'এসএমএস রিচার্জ',
      MAINTENANCE: 'মেরামত ও রক্ষণাবেক্ষণ',
      OTHER: 'বিবিধ খরচ',
    };

    const yearStart = new Date(targetYear, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    for (const e of expenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      totalExpense += e.amount;
    }

    const breakdown = Object.entries(categoryTotals).map(([cat, amount]) => ({
      category: cat,
      categoryBn: categoryNamesBn[cat] || cat,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      year: targetYear,
      totalExpense,
      breakdown,
    };
  }

  /**
   * Get combined recent activity feed (Admissions, Fee Collections, Exam Marks)
   */
  async getRecentActivities() {
    const [recentStudents, recentFees, recentExams] = await Promise.all([
      this.prisma.student.findMany({
        take: 5,
        orderBy: { admissionDate: 'desc' },
        select: {
          id: true,
          studentId: true,
          nameEn: true,
          nameBn: true,
          classLevel: true,
          admissionDate: true,
        },
      }),
      this.prisma.feeCollection.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        select: {
          id: true,
          receiptNo: true,
          paidAmount: true,
          paymentMethod: true,
          paymentDate: true,
          feeType: true,
          student: {
            select: {
              id: true,
              studentId: true,
              nameEn: true,
              nameBn: true,
            },
          },
        },
      }),
      this.prisma.exam.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          examDate: true,
          examType: true,
          isPublished: true,
          batch: { select: { name: true } },
          subject: { select: { name: true } },
          createdAt: true,
        },
      }),
    ]);

    const activities: Array<{
      id: string;
      type: 'ADMISSION' | 'FEE_COLLECTION' | 'EXAM';
      title: string;
      description: string;
      amount?: number;
      timestamp: Date;
    }> = [];

    for (const s of recentStudents) {
      activities.push({
        id: `adm-${s.id}`,
        type: 'ADMISSION',
        title: `নতুন শিক্ষার্থী ভর্তি`,
        description: `${s.nameBn || s.nameEn} (${s.studentId}) - ${s.classLevel}`,
        timestamp: s.admissionDate,
      });
    }

    for (const f of recentFees) {
      activities.push({
        id: `fee-${f.id}`,
        type: 'FEE_COLLECTION',
        title: `ফি আদায় সম্পন্ন`,
        description: `${f.student.nameBn || f.student.nameEn} (${f.receiptNo})`,
        amount: f.paidAmount,
        timestamp: f.paymentDate,
      });
    }

    for (const e of recentExams) {
      activities.push({
        id: `exam-${e.id}`,
        type: 'EXAM',
        title: `পরীক্ষা তৈরি/হালনাগাদ`,
        description: `${e.name} - ${e.subject.name} (${e.batch.name})`,
        timestamp: e.createdAt,
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, 10);
  }

  /**
   * Get next 5 upcoming exams
   */
  async getUpcomingExams() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exams = await this.prisma.exam.findMany({
      where: {
        examDate: {
          gte: today,
        },
      },
      take: 5,
      orderBy: { examDate: 'asc' },
      include: {
        batch: {
          select: { id: true, name: true, classLevel: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: { id: true, nameEn: true, nameBn: true },
        },
      },
    });

    return exams;
  }

  /**
   * Get top students with outstanding dues for quick alert panel
   */
  async getDueAlerts(limit = 6) {
    // Find all collections that have dueAmount > 0
    const dueCollections = await this.prisma.feeCollection.findMany({
      where: {
        dueAmount: { gt: 0 },
      },
      select: {
        dueAmount: true,
        student: {
          select: {
            id: true,
            studentId: true,
            nameEn: true,
            nameBn: true,
            guardianPhone: true,
            phone: true,
            classLevel: true,
            batchStudents: {
              where: { isActive: true },
              select: {
                batch: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Aggregate due by student
    const studentDueMap = new Map<
      string,
      {
        studentId: string;
        systemId: string;
        nameEn: string;
        nameBn: string | null;
        phone: string;
        classLevel: string;
        batchName: string;
        totalDue: number;
      }
    >();

    for (const item of dueCollections) {
      const s = item.student;
      if (!studentDueMap.has(s.id)) {
        const batchName = s.batchStudents[0]?.batch?.name || 'ব্যাচ নির্ধারিত নেই';
        studentDueMap.set(s.id, {
          systemId: s.id,
          studentId: s.studentId,
          nameEn: s.nameEn,
          nameBn: s.nameBn,
          phone: s.guardianPhone || s.phone || '',
          classLevel: s.classLevel,
          batchName,
          totalDue: 0,
        });
      }
      const entry = studentDueMap.get(s.id)!;
      entry.totalDue += item.dueAmount;
    }

    const sortedDues = Array.from(studentDueMap.values())
      .sort((a, b) => b.totalDue - a.totalDue)
      .slice(0, limit);

    return sortedDues;
  }
}
