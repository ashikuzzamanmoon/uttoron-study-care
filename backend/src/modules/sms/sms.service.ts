import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GreenwebGateway } from './gateways/greenweb.gateway.js';
import {
  SendIndividualSmsDto,
  SendBatchSmsDto,
  SendCustomSmsDto,
} from './dto/send-sms.dto.js';
import { QuerySmsDto } from './dto/query-sms.dto.js';
import { SmsType, SmsStatus } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GreenwebGateway,
  ) {}

  /**
   * Helper: Normalize Bangladeshi phone number
   */
  normalizePhone(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('880')) return clean;
    if (clean.startsWith('01')) return `88${clean}`;
    return clean;
  }

  /**
   * Helper: Check if string contains Unicode / Bangla characters
   */
  isUnicode(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 127) return true;
    }
    return false;
  }

  /**
   * Calculate number of SMS parts based on GSM vs Unicode rules
   */
  calculateSmsCount(message: string): {
    charCount: number;
    smsParts: number;
    isBangla: boolean;
  } {
    const isBangla = this.isUnicode(message);
    const charCount = message.length;

    let smsParts = 1;
    if (isBangla) {
      if (charCount > 70) {
        smsParts = Math.ceil(charCount / 67);
      }
    } else {
      if (charCount > 160) {
        smsParts = Math.ceil(charCount / 153);
      }
    }

    return { charCount, smsParts: Math.max(1, smsParts), isBangla };
  }

  /**
   * 1. Send Individual SMS
   */
  async sendIndividual(dto: SendIndividualSmsDto) {
    const normalizedPhone = this.normalizePhone(dto.phone);
    if (!normalizedPhone || normalizedPhone.length < 11) {
      throw new BadRequestException('সঠিক ১১-সংখ্যার মোবাইল নম্বর প্রদান করুন');
    }

    const gatewayRes = await this.gateway.sendSingle(normalizedPhone, dto.message);

    const status = gatewayRes.success ? SmsStatus.SENT : SmsStatus.FAILED;
    const { smsParts } = this.calculateSmsCount(dto.message);
    const estimatedCost = smsParts * 0.45; // Approximate BDT cost per part

    const log = await this.prisma.smsLog.create({
      data: {
        phone: normalizedPhone,
        message: dto.message,
        type: dto.type || SmsType.INDIVIDUAL,
        status,
        gatewayResponse: gatewayRes.rawResponse
          ? String(gatewayRes.rawResponse)
          : gatewayRes.error,
        cost: estimatedCost,
        sentAt: gatewayRes.success ? new Date() : null,
      },
    });

    return {
      success: gatewayRes.success,
      messageId: gatewayRes.messageId,
      status,
      logId: log.id,
      smsParts,
      error: gatewayRes.error,
    };
  }

  /**
   * 2. Send SMS to Guardian of a specific Student
   */
  async sendToStudent(studentId: string, message: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী আইডি '${studentId}' পাওয়া যায়নি`);
    }

    if (!student.guardianPhone) {
      throw new BadRequestException('এই শিক্ষার্থীর অভিভাবকের মোবাইল নম্বর নেই');
    }

    return this.sendIndividual({
      phone: student.guardianPhone,
      message,
      studentId: student.id,
      type: SmsType.INDIVIDUAL,
    });
  }

  /**
   * 3. Send SMS to all Guardians in a Batch
   */
  async sendToBatch(batchId: string, message: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchStudents: {
          where: { isActive: true },
          include: {
            student: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${batchId}' পাওয়া যায়নি`);
    }

    const uniqueRecipients = new Map<string, string>();
    for (const bs of batch.batchStudents) {
      if (bs.student?.guardianPhone) {
        const norm = this.normalizePhone(bs.student.guardianPhone);
        if (norm) {
          uniqueRecipients.set(norm, bs.student.nameBn || bs.student.nameEn);
        }
      }
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const [phone] of uniqueRecipients.entries()) {
      try {
        const res = await this.gateway.sendSingle(phone, message);
        const status = res.success ? SmsStatus.SENT : SmsStatus.FAILED;
        if (res.success) sentCount++;
        else failedCount++;

        await this.prisma.smsLog.create({
          data: {
            phone,
            message,
            type: SmsType.TRANSACTIONAL,
            status,
            gatewayResponse: res.rawResponse ? String(res.rawResponse) : res.error,
            sentAt: res.success ? new Date() : null,
          },
        });
      } catch {
        failedCount++;
      }
    }

    return {
      message: `ব্যাচের মোট ${uniqueRecipients.size} জন অভিভাবককে এসএমএস পাঠানো সম্পন্ন হয়েছে`,
      totalTarget: uniqueRecipients.size,
      sentCount,
      failedCount,
    };
  }

  /**
   * 4. Send SMS to custom phone numbers list
   */
  async sendToCustomNumbers(dto: SendCustomSmsDto) {
    const validPhones = Array.from(
      new Set(
        dto.phones
          .map((p) => this.normalizePhone(p))
          .filter((p) => p && p.length >= 11),
      ),
    );

    if (validPhones.length === 0) {
      throw new BadRequestException('কোনো বৈধ মোবাইল নম্বর পাওয়া যায়নি');
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const phone of validPhones) {
      try {
        const res = await this.gateway.sendSingle(phone, dto.message);
        if (res.success) sentCount++;
        else failedCount++;

        await this.prisma.smsLog.create({
          data: {
            phone,
            message: dto.message,
            type: SmsType.CAMPAIGN,
            status: res.success ? SmsStatus.SENT : SmsStatus.FAILED,
            gatewayResponse: res.rawResponse ? String(res.rawResponse) : res.error,
            sentAt: res.success ? new Date() : null,
          },
        });
      } catch {
        failedCount++;
      }
    }

    return {
      message: `মোট ${validPhones.length} টি নম্বরে বার্তা প্রেরণ প্রক্রিয়া সম্পন্ন হয়েছে`,
      totalTarget: validPhones.length,
      sentCount,
      failedCount,
    };
  }

  /**
   * 5. Automated: Attendance Alert SMS
   */
  async sendAttendanceAlert(attendanceId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: true,
        batch: true,
      },
    });

    if (!attendance || !attendance.student?.guardianPhone) {
      throw new BadRequestException('হাজিরা রেকর্ড বা অভিভাবকের নম্বর পাওয়া যায়নি');
    }

    const studentName = attendance.student.nameBn || attendance.student.nameEn;
    const dateStr = new Date(attendance.date).toLocaleDateString('bn-BD', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const message = `উত্তরণ স্টাডি কেয়ার: আপনার সন্তান ${studentName} আজ (${dateStr}) ক্লাসে অনুপস্থিত ছিল।`;

    return this.sendIndividual({
      phone: attendance.student.guardianPhone,
      message,
      studentId: attendance.studentId,
      type: SmsType.TRANSACTIONAL,
    });
  }

  /**
   * 6. Automated: Fee Receipt SMS
   */
  async sendFeeReceipt(feeCollectionId: string) {
    const fee = await this.prisma.feeCollection.findUnique({
      where: { id: feeCollectionId },
      include: {
        student: true,
      },
    });

    if (!fee || !fee.student?.guardianPhone) {
      throw new BadRequestException('ফি রেকর্ড বা অভিভাবকের নম্বর পাওয়া যায়নি');
    }

    const studentName = fee.student.nameBn || fee.student.nameEn;
    const feeMonthStr = fee.feeMonth ? `(${fee.feeMonth})` : '';
    const message = `উত্তরণ স্টাডি কেয়ার: মানি রসিদ নং ${fee.receiptNo}। ${studentName}-এর ফি বাবদ ৳${fee.paidAmount} গৃহীত হয়েছে। বর্তমান বকেয়া: ৳${fee.dueAmount}। ধন্যবাদ।`;

    const res = await this.sendIndividual({
      phone: fee.student.guardianPhone,
      message,
      studentId: fee.studentId,
      type: SmsType.TRANSACTIONAL,
    });

    await this.prisma.feeCollection.update({
      where: { id: feeCollectionId },
      data: { receiptSmsSent: true },
    });

    return res;
  }

  /**
   * 7. Bulk Due Reminders to specified students
   */
  async sendDueReminder(studentIds: string[]) {
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        feeCollections: {
          where: { dueAmount: { gt: 0 } },
        },
      },
    });

    let sent = 0;
    for (const stu of students) {
      const dueSum =
        stu.feeCollections.reduce(
          (acc: number, f: { dueAmount: number }) => acc + f.dueAmount,
          0,
        ) ||
        stu.monthlyFee ||
        0;
      const studentName = stu.nameBn || stu.nameEn;
      const message = `উত্তরণ স্টাডি কেয়ার: শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${studentName}-এর ফি বাবদ ৳${dueSum} বকেয়া আছে। অনুগ্রহ করে পরিশোধ করুন।`;

      if (stu.guardianPhone) {
        await this.sendIndividual({
          phone: stu.guardianPhone,
          message,
          studentId: stu.id,
          type: SmsType.TRANSACTIONAL,
        }).catch(() => null);
        sent++;
      }
    }

    return {
      message: `মোট ${sent} জন অভিভাবকের কাছে বকেয়া রিমাইন্ডার পাঠানো হয়েছে`,
      sentCount: sent,
    };
  }

  /**
   * 8. List SMS Logs with filters and pagination
   */
  async getLogs(query: QuerySmsDto) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      phone,
      startDate,
      endDate,
      search,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (phone) where.phone = { contains: phone };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { phone: { contains: term } },
        { message: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.smsLog.count({ where }),
      this.prisma.smsLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
      data: records,
    };
  }

  /**
   * 9. Check SMS Gateway Balance
   */
  async getBalance() {
    const balance = await this.gateway.checkBalance();
    return {
      balance,
      currency: 'BDT',
      approximateSmsLeft: Math.floor(balance / 0.45),
    };
  }

  /**
   * 10. Get SMS Usage Statistics
   */
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalSent, todaySent, totalFailed, balance] = await Promise.all([
      this.prisma.smsLog.count({ where: { status: SmsStatus.SENT } }),
      this.prisma.smsLog.count({
        where: {
          status: SmsStatus.SENT,
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.smsLog.count({ where: { status: SmsStatus.FAILED } }),
      this.gateway.checkBalance(),
    ]);

    return {
      todaySent,
      totalSent,
      totalFailed,
      gatewayBalance: balance,
      approximateSmsLeft: Math.floor(balance / 0.45),
    };
  }
}
