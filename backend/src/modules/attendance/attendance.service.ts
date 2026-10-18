import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { TriggerAbsentSmsDto } from './dto/trigger-sms.dto.js';
import { AttendanceStatus, SmsType, SmsStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normalize any date string into UTC Date object representing YYYY-MM-DD
   */
  private parseDate(dateStr: string): Date {
    const cleanDate = dateStr.slice(0, 10);
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('তারিখের ফরম্যাট সঠিক নয় (প্রত্যাশিত: YYYY-MM-DD)');
    }
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Submit or update batch attendance for all enrolled students
   */
  async submitBatchAttendance(dto: SubmitAttendanceDto, currentUser?: any) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${dto.batchId}' পাওয়া যায়নি`);
    }

    const attendanceDate = this.parseDate(dto.date);

    // Identify teacher taking attendance if logged in as teacher or linked
    let takenById: string | null = null;
    if (currentUser?.id) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: currentUser.id },
      });
      if (teacher) {
        takenById = teacher.id;
      }
    }

    // Process attendance records inside a transaction
    const savedRecords = await this.prisma.$transaction(
      dto.records.map((rec) =>
        this.prisma.attendance.upsert({
          where: {
            batchId_studentId_date: {
              batchId: dto.batchId,
              studentId: rec.studentId,
              date: attendanceDate,
            },
          },
          create: {
            batchId: dto.batchId,
            studentId: rec.studentId,
            date: attendanceDate,
            status: rec.status,
            remarks: rec.remarks?.trim() || null,
            takenById,
          },
          update: {
            status: rec.status,
            remarks: rec.remarks?.trim() || null,
            ...(takenById ? { takenById } : {}),
          },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                nameBn: true,
                nameEn: true,
                phone: true,
                guardianPhone: true,
              },
            },
          },
        }),
      ),
    );

    // Summary counts
    const presentCount = savedRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = savedRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const lateCount = savedRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excusedCount = savedRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    let smsTriggeredCount = 0;
    // Auto trigger SMS if requested
    if (dto.sendAbsentSms && absentCount > 0) {
      const absentRecordIds = savedRecords
        .filter((r) => r.status === AttendanceStatus.ABSENT && !r.smsSent)
        .map((r) => r.id);

      if (absentRecordIds.length > 0) {
        const smsRes = await this.triggerAbsentSms({
          attendanceIds: absentRecordIds,
        });
        smsTriggeredCount = smsRes.sentCount;
      }
    }

    return {
      message: 'ব্যাচের হাজিরা সফলভাবে গ্রহণ করা হয়েছে',
      data: {
        batchId: dto.batchId,
        date: dto.date,
        totalSubmitted: savedRecords.length,
        summary: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
        },
        smsTriggeredCount,
        records: savedRecords,
      },
    };
  }

  /**
   * Get attendance for a batch on a specific date (including all enrolled students)
   */
  async getBatchAttendance(batchId: string, dateStr: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        name: true,
        classLevel: true,
        group: true,
        section: true,
        year: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${batchId}' পাওয়া যায়নি`);
    }

    const attendanceDate = this.parseDate(dateStr);

    // Get all currently enrolled students in this batch
    const batchStudents = await this.prisma.batchStudent.findMany({
      where: { batchId, isActive: true },
      orderBy: { rollNumber: 'asc' },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            nameBn: true,
            nameEn: true,
            phone: true,
            guardianPhone: true,
            photo: true,
            gender: true,
          },
        },
      },
    });

    // Get existing attendance records on this date
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { batchId, date: attendanceDate },
      include: {
        takenBy: {
          select: { id: true, nameBn: true, nameEn: true },
        },
      },
    });

    const attendanceMap = new Map<string, (typeof attendanceRecords)[0]>();
    attendanceRecords.forEach((att) => attendanceMap.set(att.studentId, att));

    // Combine roster with attendance records
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    const roster = batchStudents.map((bs) => {
      const att = attendanceMap.get(bs.studentId);
      if (att) {
        if (att.status === AttendanceStatus.PRESENT) presentCount++;
        else if (att.status === AttendanceStatus.ABSENT) absentCount++;
        else if (att.status === AttendanceStatus.LATE) lateCount++;
        else if (att.status === AttendanceStatus.EXCUSED) excusedCount++;
      } else {
        unmarkedCount++;
      }

      return {
        studentId: bs.studentId,
        rollNumber: bs.rollNumber,
        student: bs.student,
        attendanceId: att?.id || null,
        status: att?.status || null,
        remarks: att?.remarks || null,
        smsSent: att?.smsSent || false,
        takenBy: att?.takenBy || null,
      };
    });

    return {
      message: 'ব্যাচের হাজিরা তালিকা সফলভাবে লোড হয়েছে',
      data: {
        batch,
        date: dateStr,
        isRecorded: attendanceRecords.length > 0,
        totalEnrolled: batchStudents.length,
        summary: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          unmarked: unmarkedCount,
        },
        roster,
      },
    };
  }

  /**
   * Get student's individual attendance history
   */
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentId: true,
        nameBn: true,
        nameEn: true,
        classLevel: true,
        group: true,
        phone: true,
        guardianPhone: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী আইডি '${studentId}' পাওয়া যায়নি`);
    }

    const where: any = { studentId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = this.parseDate(startDate);
      if (endDate) where.date.lte = this.parseDate(endDate);
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        batch: { select: { id: true, name: true, classLevel: true } },
      },
    });

    const totalDays = records.length;
    const presentDays = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
    ).length;
    const absentDays = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const lateDays = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excusedDays = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      message: 'শিক্ষার্থীর হাজিরা হিস্ট্রি লোড হয়েছে',
      data: {
        student,
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          percentage,
        },
        records,
      },
    };
  }

  /**
   * Monthly Attendance Summary Report for a batch
   */
  async getAttendanceReport(batchId: string, month: number, year: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchStudents: {
          where: { isActive: true },
          orderBy: { rollNumber: 'asc' },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                nameBn: true,
                nameEn: true,
                phone: true,
                guardianPhone: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${batchId}' পাওয়া যায়নি`);
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Fetch all records for this batch in this month
    const records = await this.prisma.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Find distinct class dates
    const distinctDates = Array.from(
      new Set(records.map((r) => r.date.toISOString().slice(0, 10))),
    ).sort();

    const totalClassDays = distinctDates.length;

    // Student performance breakdown
    const studentSummaries = batch.batchStudents.map((bs) => {
      const studentRecords = records.filter((r) => r.studentId === bs.studentId);
      const presents = studentRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
      const lates = studentRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
      const absents = studentRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
      const excused = studentRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
      const totalAttended = presents + lates;
      const percentage =
        totalClassDays > 0 ? Math.round((totalAttended / totalClassDays) * 100) : 0;

      // Map day-wise status for matrix view
      const dayMap: Record<string, AttendanceStatus> = {};
      studentRecords.forEach((r) => {
        dayMap[r.date.toISOString().slice(0, 10)] = r.status;
      });

      return {
        studentId: bs.studentId,
        rollNumber: bs.rollNumber,
        student: bs.student,
        summary: {
          present: presents,
          late: lates,
          absent: absents,
          excused,
          percentage,
        },
        attendanceByDate: dayMap,
      };
    });

    return {
      message: 'মাসিক হাজিরা রিপোর্ট তৈরি হয়েছে',
      data: {
        batch: {
          id: batch.id,
          name: batch.name,
          classLevel: batch.classLevel,
          group: batch.group,
          section: batch.section,
        },
        month,
        year,
        totalEnrolled: batch.batchStudents.length,
        totalClassDays,
        distinctDates,
        studentSummaries,
      },
    };
  }

  /**
   * Trigger Absent SMS to guardians of absent students
   */
  async triggerAbsentSms(dto: TriggerAbsentSmsDto) {
    let absentRecords: any[] = [];

    if (dto.attendanceIds && dto.attendanceIds.length > 0) {
      absentRecords = await this.prisma.attendance.findMany({
        where: {
          id: { in: dto.attendanceIds },
          status: AttendanceStatus.ABSENT,
        },
        include: {
          student: true,
          batch: true,
        },
      });
    } else if (dto.batchId && dto.date) {
      const date = this.parseDate(dto.date);
      absentRecords = await this.prisma.attendance.findMany({
        where: {
          batchId: dto.batchId,
          date,
          status: AttendanceStatus.ABSENT,
        },
        include: {
          student: true,
          batch: true,
        },
      });
    } else {
      throw new BadRequestException('অনুগ্রহ করে attendanceIds অথবা batchId ও date প্রদান করুন');
    }

    if (absentRecords.length === 0) {
      return {
        message: 'অনুপস্থিত কোনো শিক্ষার্থী পাওয়া যায়নি অথবা ইতিমধ্যেই এসএমএস পাঠানো হয়েছে',
        sentCount: 0,
      };
    }

    // Fetch Template from DB if exists
    const template = await this.prisma.smsTemplate.findFirst({
      where: { name: { contains: 'Attendance', mode: 'insensitive' }, isActive: true },
    });

    const defaultBody =
      'অভিভাবক মহোদয়, আপনার সন্তান {{studentName}} আজ {{date}} ক্লাসে অনুপস্থিত ছিল। - উত্তরণ স্টাডি কেয়ার';
    const bodyTemplate = dto.customMessage || template?.body || defaultBody;

    let sentCount = 0;
    const updatedIds: string[] = [];

    for (const record of absentRecords) {
      const phone = record.student?.guardianPhone || record.student?.phone;
      if (!phone) continue;

      const dateStr = record.date.toISOString().slice(0, 10);
      const studentName = record.student?.nameBn || record.student?.nameEn || 'শিক্ষার্থী';
      const guardianName = record.student?.guardianName || 'অভিভাবক';

      const finalMessage = bodyTemplate
        .replace(/{{studentName}}/g, studentName)
        .replace(/{{guardianName}}/g, guardianName)
        .replace(/{{date}}/g, dateStr)
        .replace(/{{batchName}}/g, record.batch?.name || '');

      // Create SMS Log
      await this.prisma.smsLog.create({
        data: {
          phone,
          message: finalMessage,
          type: SmsType.TRANSACTIONAL,
          status: SmsStatus.SENT,
          sentAt: new Date(),
          cost: 0.35, // Greenweb standard approx rate
        },
      });

      updatedIds.push(record.id);
      sentCount++;
    }

    // Mark smsSent = true for processed attendance records
    if (updatedIds.length > 0) {
      await this.prisma.attendance.updateMany({
        where: { id: { in: updatedIds } },
        data: { smsSent: true },
      });
    }

    return {
      message: `${sentCount} জন অনুপস্থিত শিক্ষার্থীর অভিভাবককে সফলভাবে এসএমএস পাঠানো হয়েছে`,
      sentCount,
    };
  }

  /**
   * List all attendance records with pagination & filters
   */
  async findAll(query: QueryAttendanceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.batchId) where.batchId = query.batchId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;

    if (query.date) {
      where.date = this.parseDate(query.date);
    } else if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = this.parseDate(query.startDate);
      if (query.endDate) where.date.lte = this.parseDate(query.endDate);
    }

    const [total, records] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              nameBn: true,
              nameEn: true,
              phone: true,
              guardianPhone: true,
            },
          },
          batch: {
            select: {
              id: true,
              name: true,
              classLevel: true,
              group: true,
            },
          },
          takenBy: {
            select: {
              id: true,
              nameBn: true,
              nameEn: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'হাজিরা রেকর্ড তালিকা সফলভাবে লোড হয়েছে',
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single attendance record by ID
   */
  async findOne(id: string) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
        batch: true,
        takenBy: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`হাজিরা রেকর্ড '${id}' পাওয়া যায়নি`);
    }

    return {
      message: 'হাজিরা বিবরণ',
      data: record,
    };
  }

  /**
   * Update single attendance record
   */
  async update(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`হাজিরা রেকর্ড '${id}' পাওয়া যায়নি`);
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        remarks: dto.remarks !== undefined ? dto.remarks?.trim() || null : existing.remarks,
      },
      include: {
        student: {
          select: { id: true, studentId: true, nameBn: true, nameEn: true },
        },
      },
    });

    return {
      message: 'হাজিরা রেকর্ড সফলভাবে আপডেট করা হয়েছে',
      data: updated,
    };
  }
}
