import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SmsType, SmsStatus, PaymentMethod, FeeType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Students Report: Batch-wise or institute-wide printable student list
   */
  async getStudentsReport(batchId?: string, classLevel?: string, status: string = 'ACTIVE') {
    const where: any = {};

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (classLevel && classLevel !== 'ALL') {
      where.classLevel = classLevel;
    }

    if (batchId && batchId !== 'ALL') {
      where.batchStudents = {
        some: {
          batchId,
          isActive: true,
        },
      };
    }

    const students = await this.prisma.student.findMany({
      where,
      orderBy: [
        { classLevel: 'asc' },
        { studentId: 'asc' },
      ],
      select: {
        id: true,
        studentId: true,
        nameEn: true,
        nameBn: true,
        gender: true,
        phone: true,
        guardianName: true,
        guardianPhone: true,
        instituteName: true,
        classLevel: true,
        group: true,
        admissionDate: true,
        monthlyFee: true,
        discount: true,
        isActive: true,
        batchStudents: {
          where: { isActive: true },
          select: {
            rollNumber: true,
            batch: {
              select: {
                id: true,
                name: true,
                classLevel: true,
                monthlyFee: true,
              },
            },
          },
        },
      },
    });

    let batchInfo: any = null;
    if (batchId && batchId !== 'ALL') {
      batchInfo = await this.prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, name: true, classLevel: true, monthlyFee: true },
      });
    }

    return {
      totalStudents: students.length,
      filter: { batchId, classLevel, status },
      batchInfo,
      generatedAt: new Date(),
      students: students.map((s) => {
        const primaryBatch = s.batchStudents[0];
        return {
          id: s.id,
          studentId: s.studentId,
          rollNumber: primaryBatch?.rollNumber || null,
          nameEn: s.nameEn,
          nameBn: s.nameBn,
          gender: s.gender,
          phone: s.phone,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          instituteName: s.instituteName,
          classLevel: s.classLevel,
          group: s.group,
          batchName: primaryBatch?.batch.name || 'কোনো ব্যাচে যুক্ত নেই',
          monthlyFee: s.monthlyFee || primaryBatch?.batch.monthlyFee || 0,
          discount: s.discount || 0,
          admissionDate: s.admissionDate,
          isActive: s.isActive,
        };
      }),
    };
  }

  /**
   * 2. Attendance Report: Monthly attendance summary sheet for a batch
   */
  async getAttendanceReport(batchId: string, month: number, year: number) {
    if (!batchId) {
      throw new BadRequestException('ব্যাচ আইডি (batchId) দেওয়া আবশ্যক');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchStudents: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                nameEn: true,
                nameBn: true,
                guardianPhone: true,
              },
            },
          },
          orderBy: { rollNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('ব্যাচ পাওয়া যায়নি');
    }

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const attendances = await this.prisma.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        studentId: true,
        date: true,
        status: true,
      },
    });

    // Map by student and day
    const studentAttendanceMap = new Map<string, Record<number, string>>();
    for (const a of attendances) {
      const day = new Date(a.date).getDate();
      if (!studentAttendanceMap.has(a.studentId)) {
        studentAttendanceMap.set(a.studentId, {});
      }
      studentAttendanceMap.get(a.studentId)![day] = a.status;
    }

    // Get all dates where at least one attendance was recorded (working days)
    const activeDaysSet = new Set<number>();
    for (const a of attendances) {
      activeDaysSet.add(new Date(a.date).getDate());
    }
    const workingDays = Array.from(activeDaysSet).sort((a, b) => a - b);

    const rows = batch.batchStudents.map((bs) => {
      const s = bs.student;
      const dayRecord = studentAttendanceMap.get(s.id) || {};

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      for (const day of workingDays) {
        const st = dayRecord[day];
        if (st === 'PRESENT') presentCount++;
        else if (st === 'LATE') lateCount++;
        else if (st === 'EXCUSED') excusedCount++;
        else absentCount++;
      }

      const totalActiveDays = workingDays.length;
      const effectivePresent = presentCount + lateCount;
      const rate = totalActiveDays > 0 ? Math.round((effectivePresent / totalActiveDays) * 100) : 0;

      return {
        studentId: s.studentId,
        systemId: s.id,
        rollNumber: bs.rollNumber,
        nameEn: s.nameEn,
        nameBn: s.nameBn,
        guardianPhone: s.guardianPhone,
        dailyStatus: dayRecord,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendanceRate: rate,
      };
    });

    return {
      batch: {
        id: batch.id,
        name: batch.name,
        classLevel: batch.classLevel,
        totalEnrolled: batch.batchStudents.length,
      },
      month,
      year,
      totalDaysInMonth,
      workingDays,
      generatedAt: new Date(),
      students: rows,
    };
  }

  /**
   * 3. Exam Results Report: Batch-wise Merit List
   */
  async getExamResultsReport(examId: string) {
    if (!examId) {
      throw new BadRequestException('পরীক্ষা আইডি (examId) দেওয়া আবশ্যক');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          select: { id: true, name: true, classLevel: true },
        },
        subject: {
          select: { id: true, name: true, code: true, fullMarks: true, passMarks: true },
        },
        teacher: {
          select: { id: true, nameEn: true, nameBn: true },
        },
        marks: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                nameEn: true,
                nameBn: true,
                guardianPhone: true,
                batchStudents: {
                  select: { rollNumber: true, batchId: true },
                },
              },
            },
          },
          orderBy: { obtainedMarks: 'desc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('পরীক্ষা পাওয়া যায়নি');
    }

    // Calculate merits, pass/fail counts
    let passedCount = 0;
    let failedCount = 0;
    let totalMarksObtained = 0;

    const meritList = exam.marks.map((m, idx) => {
      const isPassed = m.obtainedMarks >= exam.passMarks;
      if (isPassed) passedCount++;
      else failedCount++;
      totalMarksObtained += m.obtainedMarks;

      const roll = m.student.batchStudents.find((b) => b.batchId === exam.batchId)?.rollNumber || null;
      const percentage = Math.round((m.obtainedMarks / exam.fullMarks) * 100);

      return {
        rank: idx + 1,
        markId: m.id,
        studentId: m.student.studentId,
        rollNumber: roll,
        nameEn: m.student.nameEn,
        nameBn: m.student.nameBn,
        guardianPhone: m.student.guardianPhone,
        obtainedMarks: m.obtainedMarks,
        fullMarks: exam.fullMarks,
        percentage,
        grade: m.grade || 'F',
        isPassed,
        remarks: m.remarks,
      };
    });

    const totalStudents = meritList.length;
    const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;
    const averageMarks = totalStudents > 0 ? Math.round(totalMarksObtained / totalStudents) : 0;
    const highestMarks = meritList.length > 0 ? meritList[0].obtainedMarks : 0;

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        examType: exam.examType,
        examDate: exam.examDate,
        fullMarks: exam.fullMarks,
        passMarks: exam.passMarks,
        isPublished: exam.isPublished,
        batch: exam.batch,
        subject: exam.subject,
        teacher: exam.teacher,
      },
      stats: {
        totalStudents,
        passedCount,
        failedCount,
        passRate,
        averageMarks,
        highestMarks,
      },
      meritList,
      generatedAt: new Date(),
    };
  }

  /**
   * 4. Fee Collection Report: Daily or Monthly collections breakdown
   */
  async getFeeCollectionsReport(startDate?: string, endDate?: string, feeMonth?: string, paymentMethod?: string) {
    const where: any = {};

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.paymentDate = { gte: s, lte: e };
    }

    if (feeMonth && feeMonth !== 'ALL') {
      where.feeMonth = feeMonth;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod as PaymentMethod;
    }

    const collections = await this.prisma.feeCollection.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            nameEn: true,
            nameBn: true,
            classLevel: true,
            batchStudents: {
              where: { isActive: true },
              select: { batch: { select: { name: true } }, rollNumber: true },
            },
          },
        },
      },
    });

    let totalAmount = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const methodTotals: Record<string, number> = {};

    for (const c of collections) {
      totalAmount += c.amount;
      totalDiscount += c.discount || 0;
      totalPaid += c.paidAmount;
      totalDue += c.dueAmount;
      methodTotals[c.paymentMethod] = (methodTotals[c.paymentMethod] || 0) + c.paidAmount;
    }

    return {
      totalRecords: collections.length,
      summary: {
        totalAmount,
        totalDiscount,
        totalPaid,
        totalDue,
        methodTotals,
      },
      collections: collections.map((c) => ({
        id: c.id,
        receiptNo: c.receiptNo,
        studentId: c.student.studentId,
        studentName: c.student.nameBn || c.student.nameEn,
        classLevel: c.student.classLevel,
        batchName: c.student.batchStudents[0]?.batch?.name || 'ব্যাচ নির্ধারিত নেই',
        rollNumber: c.student.batchStudents[0]?.rollNumber || null,
        feeType: c.feeType,
        feeMonth: c.feeMonth,
        amount: c.amount,
        discount: c.discount || 0,
        paidAmount: c.paidAmount,
        dueAmount: c.dueAmount,
        paymentMethod: c.paymentMethod,
        transactionId: c.transactionId,
        paymentDate: c.paymentDate,
      })),
      generatedAt: new Date(),
    };
  }

  /**
   * 5. Dues Report: Student-wise and batch-wise outstanding dues
   */
  async getDuesReport(batchId?: string, month?: string) {
    const where: any = {
      dueAmount: { gt: 0 },
    };

    if (month && month !== 'ALL') {
      where.feeMonth = month;
    }

    if (batchId && batchId !== 'ALL') {
      where.student = {
        batchStudents: {
          some: {
            batchId,
            isActive: true,
          },
        },
      };
    }

    const dueCollections = await this.prisma.feeCollection.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
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
                rollNumber: true,
                batch: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Group dues by student
    const studentMap = new Map<string, any>();
    let grandTotalDue = 0;

    for (const c of dueCollections) {
      const s = c.student;
      if (!studentMap.has(s.id)) {
        const bs = s.batchStudents[0];
        studentMap.set(s.id, {
          studentId: s.studentId,
          systemId: s.id,
          nameEn: s.nameEn,
          nameBn: s.nameBn,
          guardianPhone: s.guardianPhone,
          phone: s.phone,
          classLevel: s.classLevel,
          batchName: bs?.batch.name || 'ব্যাচ নির্ধারিত নেই',
          rollNumber: bs?.rollNumber || null,
          totalDue: 0,
          dueMonths: [] as string[],
          receipts: [] as string[],
        });
      }

      const item = studentMap.get(s.id);
      item.totalDue += c.dueAmount;
      if (c.feeMonth && !item.dueMonths.includes(c.feeMonth)) {
        item.dueMonths.push(c.feeMonth);
      }
      item.receipts.push(c.receiptNo);
      grandTotalDue += c.dueAmount;
    }

    const students = Array.from(studentMap.values()).sort((a, b) => b.totalDue - a.totalDue);

    return {
      totalDueStudents: students.length,
      grandTotalDue,
      students,
      generatedAt: new Date(),
    };
  }

  /**
   * 6. Income & Expense Report: Comprehensive monthly or annual balance sheet
   */
  async getIncomeExpenseReport(year: number = new Date().getFullYear(), month?: number) {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const [collections, expenses] = await Promise.all([
      this.prisma.feeCollection.findMany({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
        },
        select: {
          paidAmount: true,
          feeType: true,
          paymentMethod: true,
          paymentDate: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        select: {
          amount: true,
          category: true,
          paymentMethod: true,
          expenseDate: true,
        },
      }),
    ]);

    let totalIncome = 0;
    const feeTypeTotals: Record<string, number> = {};
    for (const c of collections) {
      totalIncome += c.paidAmount;
      feeTypeTotals[c.feeType] = (feeTypeTotals[c.feeType] || 0) + c.paidAmount;
    }

    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};
    for (const e of expenses) {
      totalExpense += e.amount;
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }

    const netProfit = totalIncome - totalExpense;

    return {
      period: { year, month: month || 'ALL' },
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0,
      },
      incomeByType: feeTypeTotals,
      expenseByCategory: categoryTotals,
      generatedAt: new Date(),
    };
  }

  /**
   * 7. SMS Report: Usage, gateway status, and type distribution
   */
  async getSmsReport(startDate?: string, endDate?: string, type?: string, status?: string) {
    const where: any = {};

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.createdAt = { gte: s, lte: e };
    }

    if (type && type !== 'ALL') {
      where.type = type as SmsType;
    }

    if (status && status !== 'ALL') {
      where.status = status as SmsStatus;
    }

    const [logs, totalSent, totalFailed, totalPending] = await Promise.all([
      this.prisma.smsLog.findMany({
        where,
        take: 200,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.smsLog.count({
        where: { ...where, status: 'SENT' },
      }),
      this.prisma.smsLog.count({
        where: { ...where, status: 'FAILED' },
      }),
      this.prisma.smsLog.count({
        where: { ...where, status: 'PENDING' },
      }),
    ]);

    const totalLogs = totalSent + totalFailed + totalPending;
    const deliveryRate = totalLogs > 0 ? Math.round((totalSent / totalLogs) * 100) : 0;

    return {
      stats: {
        totalLogs,
        totalSent,
        totalFailed,
        totalPending,
        deliveryRate,
      },
      logs,
      generatedAt: new Date(),
    };
  }
}
