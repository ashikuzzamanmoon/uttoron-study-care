import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { QueryExamDto } from './dto/query-exam.dto.js';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  private parseDate(dateStr: string): Date {
    const cleanDate = dateStr.slice(0, 10);
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('তারিখের ফরম্যাট সঠিক নয় (প্রত্যাশিত: YYYY-MM-DD)');
    }
    return new Date(Date.UTC(year, month - 1, day));
  }

  async create(dto: CreateExamDto, currentUser?: any) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${dto.batchId}' পাওয়া যায়নি`);
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`বিষয় আইডি '${dto.subjectId}' পাওয়া যায়নি`);
    }

    if (dto.passMarks > dto.fullMarks) {
      throw new BadRequestException('পাস মার্ক অবশ্যই পূর্ণমানের চেয়ে কম বা সমান হতে হবে');
    }

    let teacherId = dto.teacherId || null;
    if (!teacherId && currentUser?.id) {
      const linkedTeacher = await this.prisma.teacher.findFirst({
        where: { userId: currentUser.id },
      });
      if (linkedTeacher) {
        teacherId = linkedTeacher.id;
      }
    }

    const examDate = this.parseDate(dto.examDate);

    const exam = await this.prisma.exam.create({
      data: {
        name: dto.name.trim(),
        examType: dto.examType,
        batchId: dto.batchId,
        subjectId: dto.subjectId,
        teacherId,
        examDate,
        fullMarks: dto.fullMarks,
        passMarks: dto.passMarks,
        duration: dto.duration || null,
        syllabus: dto.syllabus?.trim() || null,
        isPublished: dto.isPublished ?? false,
      },
      include: {
        batch: { select: { id: true, name: true, classLevel: true, group: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, nameBn: true, nameEn: true, phone: true } },
      },
    });

    return {
      message: 'পরীক্ষা সফলভাবে তৈরি হয়েছে',
      data: exam,
    };
  }

  async findAll(query: QueryExamDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.batchId) where.batchId = query.batchId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.examType) where.examType = query.examType;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { syllabus: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, exams] = await Promise.all([
      this.prisma.exam.count({ where }),
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { examDate: 'desc' },
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              classLevel: true,
              group: true,
              _count: { select: { batchStudents: { where: { isActive: true } } } },
            },
          },
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, nameBn: true, nameEn: true } },
          _count: { select: { marks: true } },
        },
      }),
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);

    const mappedExams = exams.map((exam) => {
      const examDateStr = exam.examDate.toISOString().slice(0, 10);
      let status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' = 'COMPLETED';
      if (examDateStr > todayStr) status = 'UPCOMING';
      else if (examDateStr === todayStr) status = 'ONGOING';

      return {
        ...exam,
        status,
        totalStudents: exam.batch._count.batchStudents,
        marksEntered: exam._count.marks,
      };
    });

    return {
      message: 'পরীক্ষার তালিকা লোড হয়েছে',
      data: mappedExams,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            classLevel: true,
            group: true,
            section: true,
            year: true,
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
                    photo: true,
                  },
                },
              },
            },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, nameBn: true, nameEn: true, phone: true } },
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
              },
            },
          },
          orderBy: { obtainedMarks: 'desc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`পরীক্ষা আইডি '${id}' পাওয়া যায়নি`);
    }

    // Compute basic statistics if marks entered
    let highestMark: number | null = null;
    let lowestMark: number | null = null;
    let averageMark: number | null = null;
    let passCount = 0;
    let failCount = 0;

    if (exam.marks.length > 0) {
      const marksArr = exam.marks.map((m) => m.obtainedMarks);
      highestMark = Math.max(...marksArr);
      lowestMark = Math.min(...marksArr);
      const sum = marksArr.reduce((a, b) => a + b, 0);
      averageMark = Math.round((sum / marksArr.length) * 10) / 10;
      passCount = exam.marks.filter((m) => m.obtainedMarks >= exam.passMarks).length;
      failCount = exam.marks.length - passCount;
    }

    return {
      message: 'পরীক্ষার বিস্তারিত তথ্য',
      data: {
        ...exam,
        stats: {
          totalEnrolled: exam.batch.batchStudents.length,
          marksEnteredCount: exam.marks.length,
          highestMark,
          lowestMark,
          averageMark,
          passCount,
          failCount,
          passRate:
            exam.marks.length > 0 ? Math.round((passCount / exam.marks.length) * 100) : 0,
        },
      },
    };
  }

  async update(id: string, dto: UpdateExamDto) {
    const existing = await this.prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`পরীক্ষা '${id}' পাওয়া যায়নি`);
    }

    if (
      dto.passMarks !== undefined &&
      dto.fullMarks !== undefined &&
      dto.passMarks > dto.fullMarks
    ) {
      throw new BadRequestException('পাস মার্ক পূর্ণমানের চেয়ে বেশি হতে পারে না');
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : existing.name,
        examType: dto.examType ?? existing.examType,
        batchId: dto.batchId ?? existing.batchId,
        subjectId: dto.subjectId ?? existing.subjectId,
        teacherId: dto.teacherId !== undefined ? dto.teacherId : existing.teacherId,
        examDate: dto.examDate ? this.parseDate(dto.examDate) : existing.examDate,
        fullMarks: dto.fullMarks ?? existing.fullMarks,
        passMarks: dto.passMarks ?? existing.passMarks,
        duration: dto.duration !== undefined ? dto.duration : existing.duration,
        syllabus: dto.syllabus !== undefined ? dto.syllabus?.trim() || null : existing.syllabus,
        isPublished: dto.isPublished ?? existing.isPublished,
      },
      include: {
        batch: { select: { id: true, name: true, classLevel: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, nameBn: true, nameEn: true } },
      },
    });

    return {
      message: 'পরীক্ষার তথ্য সফলভাবে আপডেট হয়েছে',
      data: updated,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`পরীক্ষা '${id}' পাওয়া যায়নি`);
    }

    await this.prisma.exam.delete({ where: { id } });

    return {
      message: 'পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে',
    };
  }

  async togglePublish(id: string, isPublished?: boolean) {
    const existing = await this.prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`পরীক্ষা '${id}' পাওয়া যায়নি`);
    }

    const nextState = isPublished !== undefined ? isPublished : !existing.isPublished;

    const updated = await this.prisma.exam.update({
      where: { id },
      data: { isPublished: nextState },
      select: { id: true, name: true, isPublished: true },
    });

    return {
      message: nextState
        ? 'পরীক্ষার ফলাফল সফলভাবে প্রকাশ (Published) করা হয়েছে'
        : 'পরীক্ষার ফলাফল অপ্রকাশিত (Unpublished) করা হয়েছে',
      data: updated,
    };
  }
}
