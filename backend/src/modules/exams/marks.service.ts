import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubmitBulkMarksDto } from './dto/submit-marks.dto.js';
import { UpdateMarkDto } from './dto/update-mark.dto.js';
import { SmsType, SmsStatus } from '@prisma/client';

@Injectable()
export class MarksService {
  constructor(private prisma: PrismaService) {}

  /**
   * National Curriculum Grading Scale
   */
  calculateGrade(obtained: number, full: number = 100): string {
    if (full <= 0) return 'F';
    const percentage = (obtained / full) * 100;

    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }

  /**
   * Grade Point Average (GPA) mapping
   */
  calculateGpa(grade: string): number {
    switch (grade.toUpperCase()) {
      case 'A+':
        return 5.0;
      case 'A':
        return 4.0;
      case 'A-':
        return 3.5;
      case 'B':
        return 3.0;
      case 'C':
        return 2.0;
      case 'D':
        return 1.0;
      default:
        return 0.0;
    }
  }

  /**
   * Bulk Submit/Upsert marks for an exam
   */
  async submitBulkMarks(examId: string, dto: SubmitBulkMarksDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException(`পরীক্ষা আইডি '${examId}' পাওয়া যায়নি`);
    }

    // Validate that marks do not exceed full marks
    for (const item of dto.marks) {
      if (item.obtainedMarks > exam.fullMarks) {
        throw new BadRequestException(
          `প্রাপ্ত নম্বর (${item.obtainedMarks}) পরীক্ষার পূর্ণমানের (${exam.fullMarks}) চেয়ে বেশি হতে পারে না`,
        );
      }
    }

    // Upsert marks in transaction
    const savedMarks = await this.prisma.$transaction(
      dto.marks.map((item) => {
        const grade = this.calculateGrade(item.obtainedMarks, exam.fullMarks);
        return this.prisma.mark.upsert({
          where: {
            examId_studentId_subjectId: {
              examId,
              studentId: item.studentId,
              subjectId: exam.subjectId,
            },
          },
          create: {
            examId,
            studentId: item.studentId,
            subjectId: exam.subjectId,
            obtainedMarks: item.obtainedMarks,
            grade,
            remarks: item.remarks?.trim() || null,
          },
          update: {
            obtainedMarks: item.obtainedMarks,
            grade,
            remarks: item.remarks?.trim() || null,
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
        });
      }),
    );

    // If publishImmediately requested
    if (dto.publishImmediately) {
      await this.prisma.exam.update({
        where: { id: examId },
        data: { isPublished: true },
      });
    }

    let smsSentCount = 0;
    // Auto send result SMS if requested
    if (dto.sendResultSms) {
      const smsRes = await this.triggerResultSms(examId);
      smsSentCount = smsRes.sentCount;
    }

    return {
      message: `${savedMarks.length} জন শিক্ষার্থীর মার্কস সফলভাবে সংরক্ষণ করা হয়েছে`,
      data: {
        examId,
        totalSubmitted: savedMarks.length,
        isPublished: dto.publishImmediately || exam.isPublished,
        smsSentCount,
        marks: savedMarks,
      },
    };
  }

  /**
   * Update single mark record
   */
  async updateSingleMark(markId: string, dto: UpdateMarkDto) {
    const existing = await this.prisma.mark.findUnique({
      where: { id: markId },
      include: { exam: true },
    });

    if (!existing) {
      throw new NotFoundException(`মার্ক রেকর্ড '${markId}' পাওয়া যায়নি`);
    }

    const newMarks = dto.obtainedMarks !== undefined ? dto.obtainedMarks : existing.obtainedMarks;
    if (newMarks > existing.exam.fullMarks) {
      throw new BadRequestException(
        `প্রাপ্ত নম্বর (${newMarks}) পরীক্ষার পূর্ণমানের (${existing.exam.fullMarks}) চেয়ে বেশি হতে পারে না`,
      );
    }

    const grade = this.calculateGrade(newMarks, existing.exam.fullMarks);

    const updated = await this.prisma.mark.update({
      where: { id: markId },
      data: {
        obtainedMarks: newMarks,
        grade,
        remarks: dto.remarks !== undefined ? dto.remarks?.trim() || null : existing.remarks,
      },
      include: {
        student: { select: { id: true, studentId: true, nameBn: true, nameEn: true } },
      },
    });

    return {
      message: 'মার্ক সফলভাবে আপডেট হয়েছে',
      data: updated,
    };
  }

  /**
   * Get all marks for an exam (spreadsheet roster ready)
   */
  async getMarksByExam(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            classLevel: true,
            group: true,
            section: true,
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
        },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException(`পরীক্ষা আইডি '${examId}' পাওয়া যায়নি`);
    }

    const existingMarks = await this.prisma.mark.findMany({
      where: { examId },
    });

    const markMap = new Map<string, (typeof existingMarks)[0]>();
    existingMarks.forEach((m) => markMap.set(m.studentId, m));

    // Combine roster with marks
    const roster = exam.batch.batchStudents.map((bs) => {
      const mark = markMap.get(bs.studentId);
      return {
        studentId: bs.studentId,
        rollNumber: bs.rollNumber,
        student: bs.student,
        markId: mark?.id || null,
        obtainedMarks: mark?.obtainedMarks !== undefined ? mark.obtainedMarks : null,
        grade: mark?.grade || null,
        gpa: mark?.grade ? this.calculateGpa(mark.grade) : null,
        remarks: mark?.remarks || '',
      };
    });

    return {
      message: 'পরীক্ষার মার্কস তালিকা লোড হয়েছে',
      data: {
        exam,
        totalEnrolled: exam.batch.batchStudents.length,
        marksEnteredCount: existingMarks.length,
        roster,
      },
    };
  }

  /**
   * Get full result sheet with merit list
   */
  async getResultSheet(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: { select: { id: true, name: true, classLevel: true, group: true } },
        subject: { select: { id: true, name: true, code: true } },
        marks: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                nameBn: true,
                nameEn: true,
                phone: true,
                guardianPhone: true,
                guardianName: true,
              },
            },
          },
          orderBy: { obtainedMarks: 'desc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`পরীক্ষা আইডি '${examId}' পাওয়া যায়নি`);
    }

    if (exam.marks.length === 0) {
      return {
        message: 'এই পরীক্ষায় এখনও কোনো মার্কস এন্ট্রি করা হয়নি',
        data: {
          exam,
          stats: null,
          meritList: [],
        },
      };
    }

    // Calculate Merit Ranks
    let currentRank = 1;
    const meritList = exam.marks.map((m, index) => {
      // Tie breaker check with previous student
      if (index > 0 && m.obtainedMarks < exam.marks[index - 1].obtainedMarks) {
        currentRank = index + 1;
      }

      const percentage = Math.round((m.obtainedMarks / exam.fullMarks) * 100);
      const isPassed = m.obtainedMarks >= exam.passMarks;
      const gpa = this.calculateGpa(m.grade || 'F');

      return {
        rank: currentRank,
        markId: m.id,
        studentId: m.studentId,
        student: m.student,
        obtainedMarks: m.obtainedMarks,
        fullMarks: exam.fullMarks,
        passMarks: exam.passMarks,
        percentage,
        grade: m.grade || 'F',
        gpa,
        status: isPassed ? 'PASSED' : 'FAILED',
        remarks: m.remarks,
      };
    });

    const marksArr = exam.marks.map((m) => m.obtainedMarks);
    const highestMark = Math.max(...marksArr);
    const lowestMark = Math.min(...marksArr);
    const avg = marksArr.reduce((a, b) => a + b, 0) / marksArr.length;
    const passCount = meritList.filter((m) => m.status === 'PASSED').length;

    return {
      message: 'পূর্ণাঙ্গ রেজাল্ট শিট ও মেরিট লিস্ট প্রস্তুত',
      data: {
        exam,
        stats: {
          totalParticipants: meritList.length,
          highestMark,
          lowestMark,
          averageMark: Math.round(avg * 10) / 10,
          passCount,
          failCount: meritList.length - passCount,
          passRate: Math.round((passCount / meritList.length) * 100),
        },
        meritList,
      },
    };
  }

  /**
   * Get single student result card for an exam
   */
  async getStudentResultCard(studentId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            classLevel: true,
            group: true,
            batchStudents: {
              where: { studentId },
              select: { rollNumber: true },
            },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        marks: {
          orderBy: { obtainedMarks: 'desc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`পরীক্ষা আইডি '${examId}' পাওয়া যায়নি`);
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী আইডি '${studentId}' পাওয়া যায়নি`);
    }

    const markRecord = exam.marks.find((m) => m.studentId === studentId);
    if (!markRecord) {
      throw new NotFoundException('এই পরীক্ষায় শিক্ষার্থীর কোনো মার্কস পাওয়া যায়নি');
    }

    // Find rank in exam
    const sortedMarks = exam.marks.map((m) => m.obtainedMarks);
    const highestMarkInBatch = Math.max(...sortedMarks);
    const rank = sortedMarks.indexOf(markRecord.obtainedMarks) + 1;
    const isPassed = markRecord.obtainedMarks >= exam.passMarks;
    const percentage = Math.round((markRecord.obtainedMarks / exam.fullMarks) * 100);
    const gpa = this.calculateGpa(markRecord.grade || 'F');

    return {
      message: 'শিক্ষার্থীর রেজাল্ট কার্ড',
      data: {
        student: {
          id: student.id,
          studentId: student.studentId,
          nameBn: student.nameBn,
          nameEn: student.nameEn,
          rollNumber: exam.batch.batchStudents[0]?.rollNumber || null,
          photo: student.photo,
        },
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
        },
        result: {
          obtainedMarks: markRecord.obtainedMarks,
          percentage,
          grade: markRecord.grade || 'F',
          gpa,
          status: isPassed ? 'PASSED' : 'FAILED',
          rank,
          totalParticipants: exam.marks.length,
          highestMarkInBatch,
          remarks: markRecord.remarks,
        },
      },
    };
  }

  /**
   * Get all marks for a student across all exams
   */
  async getStudentMarks(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, studentId: true, nameBn: true, nameEn: true },
    });
    if (!student) {
      throw new NotFoundException(`শিক্ষার্থী '${studentId}' পাওয়া যায়নি`);
    }

    const marks = await this.prisma.mark.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
            examDate: true,
            fullMarks: true,
            passMarks: true,
            isPublished: true,
            batch: { select: { id: true, name: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return {
      message: 'শিক্ষার্থীর সকল পরীক্ষার মার্কস তালিকা',
      data: {
        student,
        totalExamsTaken: marks.length,
        marks,
      },
    };
  }

  /**
   * Trigger Result SMS to guardians
   */
  async triggerResultSms(examId: string) {
    const resultSheetRes = await this.getResultSheet(examId);
    const meritList = resultSheetRes.data.meritList || [];
    const exam = resultSheetRes.data.exam;

    if (meritList.length === 0) {
      return {
        message: 'এসএমএস পাঠানোর জন্য কোনো মার্কস পাওয়া যায়নি',
        sentCount: 0,
      };
    }

    // Check template
    const template = await this.prisma.smsTemplate.findFirst({
      where: { name: { contains: 'Result', mode: 'insensitive' }, isActive: true },
    });

    const defaultBody =
      'অভিভাবক মহোদয়, {{studentName}}-এর {{examName}} পরীক্ষার ফলাফল: প্রাপ্ত নম্বর- {{obtainedMarks}}/{{fullMarks}}, গ্রেড- {{grade}}, মেধাক্রম- {{rank}}। - উত্তরণ স্টাডি কেয়ার';
    const bodyTemplate = template?.body || defaultBody;

    let sentCount = 0;

    for (const item of meritList) {
      const phone = item.student?.guardianPhone || item.student?.phone;
      if (!phone) continue;

      const studentName = item.student?.nameBn || item.student?.nameEn || 'শিক্ষার্থী';
      const guardianName = item.student?.guardianName || 'অভিভাবক';

      const finalMessage = bodyTemplate
        .replace(/{{studentName}}/g, studentName)
        .replace(/{{guardianName}}/g, guardianName)
        .replace(/{{examName}}/g, exam.name)
        .replace(/{{obtainedMarks}}/g, String(item.obtainedMarks))
        .replace(/{{fullMarks}}/g, String(item.fullMarks))
        .replace(/{{grade}}/g, item.grade)
        .replace(/{{rank}}/g, String(item.rank))
        .replace(/{{subjectName}}/g, exam.subject?.name || '');

      await this.prisma.smsLog.create({
        data: {
          phone,
          message: finalMessage,
          type: SmsType.TRANSACTIONAL,
          status: SmsStatus.SENT,
          sentAt: new Date(),
          cost: 0.35,
        },
      });

      sentCount++;
    }

    return {
      message: `${sentCount} জন অভিভাবকের কাছে সফলভাবে পরীক্ষার ফলাফল এসএমএস পাঠানো হয়েছে`,
      sentCount,
    };
  }
}
