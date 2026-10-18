import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { UpdateBatchDto } from './dto/update-batch.dto.js';
import { QueryBatchDto } from './dto/query-batch.dto.js';
import { StudentEnrollmentItem } from './dto/enroll-students.dto.js';
import { BatchTeacherItem } from './dto/assign-batch-teachers.dto.js';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBatchDto) {
    const batch = await this.prisma.batch.create({
      data: {
        name: dto.name.trim(),
        classLevel: dto.classLevel.trim(),
        group: dto.group?.trim(),
        section: dto.section?.trim(),
        year: dto.year,
        maxStudents: dto.maxStudents ?? 40,
        monthlyFee: dto.monthlyFee ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      message: 'Batch created successfully',
      data: batch,
    };
  }

  async findAll(query: QueryBatchDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { classLevel: { contains: search, mode: 'insensitive' } },
        { group: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.classLevel) {
      where.classLevel = query.classLevel;
    }

    if (query.group) {
      where.group = query.group;
    }

    if (query.year) {
      where.year = query.year;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, batches] = await Promise.all([
      this.prisma.batch.count({ where }),
      this.prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          batchTeachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  teacherId: true,
                  nameEn: true,
                  nameBn: true,
                  phone: true,
                },
              },
            },
          },
          batchSubjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              batchStudents: {
                where: { isActive: true },
              },
              routineSlots: true,
              exams: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Batches retrieved successfully',
      data: batches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        batchTeachers: {
          include: {
            teacher: true,
          },
        },
        batchSubjects: {
          include: {
            subject: true,
          },
        },
        batchStudents: {
          where: { isActive: true },
          orderBy: { rollNumber: 'asc' },
          include: {
            student: true,
          },
        },
        routineSlots: {
          orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          include: {
            subject: true,
            teacher: true,
          },
        },
        _count: {
          select: {
            batchStudents: { where: { isActive: true } },
            exams: true,
            attendances: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID '${id}' not found`);
    }

    return {
      message: 'Batch details retrieved successfully',
      data: batch,
    };
  }

  async update(id: string, dto: UpdateBatchDto) {
    const existing = await this.prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Batch with ID '${id}' not found`);
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.classLevel && { classLevel: dto.classLevel.trim() }),
        ...(dto.group !== undefined && { group: dto.group?.trim() }),
        ...(dto.section !== undefined && { section: dto.section?.trim() }),
        ...(dto.year && { year: dto.year }),
        ...(dto.maxStudents !== undefined && { maxStudents: dto.maxStudents }),
        ...(dto.monthlyFee !== undefined && { monthlyFee: dto.monthlyFee }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      message: 'Batch updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${id}' not found`);
    }

    await this.prisma.batch.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Batch marked inactive (soft deleted) successfully',
      data: { id, isActive: false },
    };
  }

  async addStudents(batchId: string, students: StudentEnrollmentItem[]) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${batchId}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of students) {
        await tx.batchStudent.upsert({
          where: {
            batchId_studentId: {
              batchId,
              studentId: item.studentId,
            },
          },
          update: {
            rollNumber: item.rollNumber ?? undefined,
            isActive: true,
            leftAt: null,
          },
          create: {
            batchId,
            studentId: item.studentId,
            rollNumber: item.rollNumber ?? null,
            isActive: true,
          },
        });
      }
    });

    return {
      message: `${students.length} students enrolled in batch successfully`,
    };
  }

  async removeStudent(batchId: string, studentId: string) {
    const enrollment = await this.prisma.batchStudent.findUnique({
      where: {
        batchId_studentId: {
          batchId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this batch');
    }

    await this.prisma.batchStudent.update({
      where: { id: enrollment.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    return {
      message: 'Student unenrolled from batch successfully',
    };
  }

  async assignTeachers(batchId: string, teachers: BatchTeacherItem[]) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${batchId}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.batchTeacher.deleteMany({ where: { batchId } });

      if (teachers.length > 0) {
        await tx.batchTeacher.createMany({
          data: teachers.map((t) => ({
            batchId,
            teacherId: t.teacherId,
            isPrimary: t.isPrimary ?? false,
          })),
        });
      }
    });

    return {
      message: 'Teachers assigned to batch successfully',
    };
  }

  async addSubjects(batchId: string, subjectIds: string[]) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${batchId}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.batchSubject.deleteMany({ where: { batchId } });

      if (subjectIds.length > 0) {
        await tx.batchSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            batchId,
            subjectId,
          })),
        });
      }
    });

    return {
      message: 'Subjects assigned to batch successfully',
    };
  }

  async getStudents(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${batchId}' not found`);
    }

    const students = await this.prisma.batchStudent.findMany({
      where: {
        batchId,
        isActive: true,
      },
      orderBy: { rollNumber: 'asc' },
      include: {
        student: true,
      },
    });

    return {
      message: 'Batch students retrieved successfully',
      data: students,
    };
  }

  async getRoutine(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${batchId}' not found`);
    }

    const slots = await this.prisma.routineSlot.findMany({
      where: { batchId },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: { id: true, nameEn: true, nameBn: true },
        },
      },
    });

    return {
      message: 'Batch routine timetable retrieved successfully',
      data: slots,
    };
  }
}
