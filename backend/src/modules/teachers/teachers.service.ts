import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { QueryTeacherDto } from './dto/query-teacher.dto.js';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  private async generateTeacherId(): Promise<string> {
    const lastTeacher = await this.prisma.teacher.findFirst({
      orderBy: { teacherId: 'desc' },
      select: { teacherId: true },
    });

    let nextNumber = 1;
    if (lastTeacher && lastTeacher.teacherId.startsWith('TCH-')) {
      const parts = lastTeacher.teacherId.split('-');
      if (parts.length === 2) {
        const lastNum = parseInt(parts[1], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `TCH-${paddedNumber}`;
  }

  async create(dto: CreateTeacherDto) {
    const teacherId = await this.generateTeacherId();
    const { subjectIds, ...teacherData } = dto;

    const teacher = await this.prisma.$transaction(async (tx) => {
      const newTeacher = await tx.teacher.create({
        data: {
          ...teacherData,
          teacherId,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        },
      });

      if (subjectIds && subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            teacherId: newTeacher.id,
            subjectId,
          })),
          skipDuplicates: true,
        });
      }

      return newTeacher;
    });

    return {
      message: 'Teacher registered successfully',
      data: teacher,
    };
  }

  async findAll(query: QueryTeacherDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search, mode: 'insensitive' } },
        { teacherId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.designation) {
      where.designation = query.designation;
    }

    if (query.specialization) {
      where.specialization = {
        contains: query.specialization,
        mode: 'insensitive',
      };
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, teachers] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          teacherSubjects: {
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
              batchTeachers: true,
              routineSlots: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Teachers retrieved successfully',
      data: teachers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
        batchTeachers: {
          include: {
            batch: true,
          },
        },
        routineSlots: {
          include: {
            batch: true,
            subject: true,
          },
        },
        _count: {
          select: {
            examsCreated: true,
            attendancesTaken: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID '${id}' not found`);
    }

    return {
      message: 'Teacher details retrieved successfully',
      data: teacher,
    };
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Teacher with ID '${id}' not found`);
    }

    const { subjectIds, ...updateData } = dto;

    const teacher = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.teacher.update({
        where: { id },
        data: {
          ...updateData,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        },
      });

      if (subjectIds) {
        await tx.teacherSubject.deleteMany({
          where: { teacherId: id },
        });

        if (subjectIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjectIds.map((subjectId) => ({
              teacherId: id,
              subjectId,
            })),
          });
        }
      }

      return updated;
    });

    return {
      message: 'Teacher updated successfully',
      data: teacher,
    };
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID '${id}' not found`);
    }

    await this.prisma.teacher.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Teacher marked inactive (soft deleted) successfully',
      data: { id, isActive: false },
    };
  }

  async assignSubjects(id: string, subjectIds: string[]) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID '${id}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherSubject.deleteMany({
        where: { teacherId: id },
      });

      if (subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            teacherId: id,
            subjectId,
          })),
        });
      }
    });

    const updated = await this.findOne(id);
    return {
      message: 'Subjects assigned to teacher successfully',
      data: updated.data,
    };
  }

  async getSchedule(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID '${id}' not found`);
    }

    const slots = await this.prisma.routineSlot.findMany({
      where: { teacherId: id },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            classLevel: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: 'Teacher routine schedule retrieved successfully',
      data: slots,
    };
  }
}
