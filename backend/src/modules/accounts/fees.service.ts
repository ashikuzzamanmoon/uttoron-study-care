import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CollectFeeDto } from './dto/collect-fee.dto.js';
import { QueryFeeDto } from './dto/query-fee.dto.js';
import { FeeType, PaymentMethod, SmsType, SmsStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Convert number to English words for receipts
   */
  private numberToWords(amount: number): string {
    const num = Math.floor(amount);
    if (num === 0) return 'Zero Taka Only';

    const a = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const b = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          ' Hundred' +
          (n % 100 !== 0 ? ' ' + convert(n % 100) : '')
        );
      if (n < 100000)
        return (
          convert(Math.floor(n / 1000)) +
          ' Thousand' +
          (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
        );
      if (n < 10000000)
        return (
          convert(Math.floor(n / 100000)) +
          ' Lakh' +
          (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')
        );
      return (
        convert(Math.floor(n / 10000000)) +
        ' Crore' +
        (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '')
      );
    };

    return `${convert(num)} Taka Only`;
  }

  /**
   * Generate sequential receipt number: RCP-YYYY-NNNN
   */
  private async generateReceiptNo(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `RCP-${currentYear}-`;

    const latest = await this.prisma.feeCollection.findFirst({
      where: {
        receiptNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNo: 'desc',
      },
      select: {
        receiptNo: true,
      },
    });

    let sequence = 1;
    if (latest?.receiptNo) {
      const parts = latest.receiptNo.split('-');
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
   * Collect student fee and issue receipt
   */
  async collectFee(dto: CollectFeeDto, currentUser?: any) {
    // 1. Verify student
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: {
        batchStudents: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী আইডি '${dto.studentId}' পাওয়া যায়নি`);
    }

    // 2. Financial calculation
    const amount = Number(dto.amount) || 0;
    const discount = Number(dto.discount) || 0;
    const fine = Number(dto.fine) || 0;
    const netPayable = amount - discount + fine;
    const paidAmount = Number(dto.paidAmount) || 0;
    const dueAmount = Math.max(0, netPayable - paidAmount);

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    // 3. Generate receipt number with retry protection
    let receiptNo = await this.generateReceiptNo();
    const existing = await this.prisma.feeCollection.findUnique({
      where: { receiptNo },
    });
    if (existing) {
      const fallbackSeq = Math.floor(1000 + Math.random() * 9000);
      receiptNo = `RCP-${new Date().getFullYear()}-${fallbackSeq}`;
    }

    // 4. Create Fee Collection record
    const feeRecord = await this.prisma.feeCollection.create({
      data: {
        studentId: dto.studentId,
        receiptNo,
        feeType: dto.feeType || FeeType.MONTHLY_FEE,
        feeMonth: dto.feeMonth || null,
        amount,
        discount,
        fine,
        paidAmount,
        dueAmount,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        transactionId: dto.transactionId || null,
        paymentDate,
        remarks: dto.remarks || null,
        receiptSmsSent: false,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            nameEn: true,
            nameBn: true,
            guardianPhone: true,
            guardianName: true,
          },
        },
      },
    });

    // 5. Trigger SMS receipt if requested and phone number exists
    if (dto.sendSms !== false && student.guardianPhone) {
      await this.sendReceiptSms(feeRecord.id).catch(() => null);
    }

    return {
      message: 'ফি সফলভাবে গ্রহণ করা হয়েছে এবং রসিদ তৈরি হয়েছে',
      data: feeRecord,
    };
  }

  /**
   * List all fee collections with filters & pagination
   */
  async findAll(query: QueryFeeDto) {
    const {
      page = 1,
      limit = 20,
      studentId,
      batchId,
      feeType,
      feeMonth,
      paymentMethod,
      startDate,
      endDate,
      search,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (feeType) {
      where.feeType = feeType;
    }

    if (feeMonth) {
      where.feeMonth = feeMonth;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (batchId) {
      where.student = {
        batchStudents: {
          some: {
            batchId,
          },
        },
      };
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { receiptNo: { contains: term, mode: 'insensitive' } },
        { transactionId: { contains: term, mode: 'insensitive' } },
        {
          student: {
            OR: [
              { nameEn: { contains: term, mode: 'insensitive' } },
              { nameBn: { contains: term, mode: 'insensitive' } },
              { studentId: { contains: term, mode: 'insensitive' } },
              { guardianPhone: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, records, aggregations] = await Promise.all([
      this.prisma.feeCollection.count({ where }),
      this.prisma.feeCollection.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              nameEn: true,
              nameBn: true,
              guardianPhone: true,
              guardianName: true,
              batchStudents: {
                include: {
                  batch: {
                    select: {
                      id: true,
                      name: true,
                      classLevel: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.feeCollection.aggregate({
        where,
        _sum: {
          amount: true,
          discount: true,
          fine: true,
          paidAmount: true,
          dueAmount: true,
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
        totalAmount: aggregations._sum.amount || 0,
        totalDiscount: aggregations._sum.discount || 0,
        totalFine: aggregations._sum.fine || 0,
        totalPaid: aggregations._sum.paidAmount || 0,
        totalDue: aggregations._sum.dueAmount || 0,
      },
      data: records,
    };
  }

  /**
   * Get single fee collection by ID
   */
  async findOne(id: string) {
    const fee = await this.prisma.feeCollection.findUnique({
      where: { id },
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
    });

    if (!fee) {
      throw new NotFoundException(`রসিদ আইডি '${id}' পাওয়া যায়নি`);
    }

    return fee;
  }

  /**
   * Get fee history of a specific student
   */
  async getStudentFeeHistory(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        batchStudents: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী আইডি '${studentId}' পাওয়া যায়নি`);
    }

    const records = await this.prisma.feeCollection.findMany({
      where: { studentId },
      orderBy: { paymentDate: 'desc' },
    });

    const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalDiscount = records.reduce((sum, r) => sum + (r.discount || 0), 0);
    const totalDue = records.reduce((sum, r) => sum + r.dueAmount, 0);

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        nameEn: student.nameEn,
        nameBn: student.nameBn,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        monthlyFee: student.monthlyFee,
        discount: student.discount,
        batches: student.batchStudents.map((bs) => ({
          id: bs.batch.id,
          name: bs.batch.name,
          classLevel: bs.batch.classLevel,
          rollNo: bs.rollNumber,
        })),
      },
      summary: {
        totalTransactions: records.length,
        totalPaid,
        totalDiscount,
        totalDue,
      },
      history: records,
    };
  }

  /**
   * List students with due fees
   */
  async getDues(batchId?: string, month?: string) {
    // 1. Fetch active students (optionally filtered by batch)
    const studentWhere: any = { isActive: true };
    if (batchId) {
      studentWhere.batchStudents = {
        some: { batchId },
      };
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        batchStudents: {
          include: {
            batch: true,
          },
        },
        feeCollections: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { nameEn: 'asc' },
    });

    const duesList: any[] = [];
    const targetMonth = month || new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

    for (const student of students) {
      const primaryBatch = student.batchStudents[0]?.batch;
      const expectedMonthly = student.monthlyFee && student.monthlyFee > 0
        ? student.monthlyFee
        : (primaryBatch?.monthlyFee || 0);

      const studentDiscount = student.discount || 0;
      const netExpected = Math.max(0, expectedMonthly - studentDiscount);

      // Check payments for the target month
      const monthPayments = student.feeCollections.filter(
        (f) => f.feeMonth?.toLowerCase().trim() === targetMonth.toLowerCase().trim() &&
               f.feeType === FeeType.MONTHLY_FEE,
      );
      const paidForMonth = monthPayments.reduce((acc, p) => acc + p.paidAmount, 0);

      // Calculate unpaid from target month
      let monthDue = 0;
      if (paidForMonth < netExpected) {
        monthDue = netExpected - paidForMonth;
      }

      // Also gather any accumulated due amounts from partial receipts
      const accumulatedDues = student.feeCollections.reduce(
        (acc, p) => acc + (p.dueAmount || 0),
        0,
      );

      const totalStudentDue = monthDue > 0 ? monthDue : accumulatedDues;

      if (totalStudentDue > 0) {
        duesList.push({
          studentId: student.id,
          systemId: student.studentId,
          nameEn: student.nameEn,
          nameBn: student.nameBn,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          batchName: primaryBatch?.name || 'কোনো ব্যাচে যুক্ত নেই',
          classLevel: primaryBatch?.classLevel || '-',
          targetMonth,
          expectedFee: netExpected,
          paidForMonth,
          dueAmount: totalStudentDue,
          lastPaymentDate: student.feeCollections[0]?.paymentDate || null,
        });
      }
    }

    // Sort by dueAmount descending
    duesList.sort((a, b) => b.dueAmount - a.dueAmount);

    const totalDueSum = duesList.reduce((sum, item) => sum + item.dueAmount, 0);

    return {
      targetMonth,
      totalStudentsWithDue: duesList.length,
      totalDueAmount: totalDueSum,
      data: duesList,
    };
  }

  /**
   * Generate structured printable receipt data
   */
  async generateReceipt(id: string) {
    const fee = await this.findOne(id);
    const primaryBatch = fee.student.batchStudents[0]?.batch;
    const rollNo = fee.student.batchStudents[0]?.rollNumber;

    const netPayable = (fee.amount - (fee.discount || 0)) + (fee.fine || 0);

    return {
      institute: {
        name: 'উত্তরণ স্টাডি কেয়ার',
        nameEn: 'Uttoron Study Care',
        slogan: 'জ্ঞান, শৃঙ্খলা ও সাফল্যের বাতিঘর',
        address: 'পূর্ব কাজীপাড়া, মিরপুর, ঢাকা-১২১৬',
        phone: '০১৭০০-০০০০০০, ০১৮০০-০০০০০০',
        email: 'uttoronstudycare@gmail.com',
      },
      receipt: {
        id: fee.id,
        receiptNo: fee.receiptNo,
        paymentDate: fee.paymentDate,
        createdAt: fee.createdAt,
        feeType: fee.feeType,
        feeMonth: fee.feeMonth || '-',
        amount: fee.amount,
        discount: fee.discount || 0,
        fine: fee.fine || 0,
        netPayable,
        paidAmount: fee.paidAmount,
        dueAmount: fee.dueAmount,
        paymentMethod: fee.paymentMethod,
        transactionId: fee.transactionId || 'N/A',
        remarks: fee.remarks || '',
        inWords: this.numberToWords(fee.paidAmount),
      },
      student: {
        id: fee.student.id,
        studentId: fee.student.studentId,
        nameEn: fee.student.nameEn,
        nameBn: fee.student.nameBn,
        guardianName: fee.student.guardianName,
        guardianPhone: fee.student.guardianPhone,
        batchName: primaryBatch?.name || '-',
        classLevel: primaryBatch?.classLevel || '-',
        rollNo: rollNo || '-',
      },
    };
  }

  /**
   * Send receipt confirmation SMS to student guardian
   */
  async sendReceiptSms(id: string) {
    const fee = await this.findOne(id);

    if (!fee.student.guardianPhone) {
      throw new BadRequestException('অভিভাবকের মোবাইল নম্বর পাওয়া যায়নি');
    }

    const studentName = fee.student.nameBn || fee.student.nameEn;
    const feeMonthStr = fee.feeMonth ? `(${fee.feeMonth})` : '';
    const message = `উত্তরণ স্টাডি কেয়ার: মানি রসিদ নং ${fee.receiptNo}। ${studentName}-এর ফি বাবদ ${fee.paidAmount} টাকা গৃহীত হয়েছে। বর্তমান বকেয়া: ${fee.dueAmount} টাকা। ধন্যবাদ।`;

    // Create record in SmsLog
    await this.prisma.smsLog.create({
      data: {
        phone: fee.student.guardianPhone,
        message,
        type: SmsType.TRANSACTIONAL,
        status: SmsStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Mark as sent
    await this.prisma.feeCollection.update({
      where: { id },
      data: { receiptSmsSent: true },
    });

    return {
      message: 'রসিদ এসএমএস সফলভাবে পাঠানো হয়েছে',
      recipientPhone: fee.student.guardianPhone,
      smsText: message,
    };
  }
}
