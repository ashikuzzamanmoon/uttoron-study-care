import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { QueryStudentDto } from './dto/query-student.dto.js';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `USC-${year}-`;

    const lastStudent = await this.prisma.student.findFirst({
      where: {
        studentId: {
          startsWith: prefix,
        },
      },
      orderBy: {
        studentId: 'desc',
      },
      select: {
        studentId: true,
      },
    });

    let nextNumber = 1;
    if (lastStudent) {
      const parts = lastStudent.studentId.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  }

  async create(dto: CreateStudentDto) {
    const studentId = await this.generateStudentId();

    const { batchId, rollNumber, ...studentData } = dto;

    const student = await this.prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          ...studentData,
          studentId,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : new Date(),
        },
      });

      if (batchId) {
        const batch = await tx.batch.findUnique({ where: { id: batchId } });
        if (batch) {
          await tx.batchStudent.create({
            data: {
              batchId,
              studentId: newStudent.id,
              rollNumber: rollNumber ?? null,
            },
          });
        }
      }

      return newStudent;
    });

    return {
      message: 'Student enrolled successfully',
      data: student,
    };
  }

  async findAll(query: QueryStudentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.classLevel) {
      where.classLevel = query.classLevel;
    }

    if (query.group) {
      where.group = query.group;
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.batchId) {
      where.batchStudents = {
        some: {
          batchId: query.batchId,
          isActive: true,
        },
      };
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          batchStudents: {
            where: { isActive: true },
            include: {
              batch: {
                select: {
                  id: true,
                  name: true,
                  classLevel: true,
                  year: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendances: true,
              marks: true,
              feeCollections: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Students retrieved successfully',
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        batchStudents: {
          include: {
            batch: true,
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        marks: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            exam: true,
            subject: true,
          },
        },
        feeCollections: {
          take: 20,
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    return {
      message: 'Student details retrieved successfully',
      data: student,
    };
  }

  async update(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    const { batchId, rollNumber, ...updateData } = dto;

    const student = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: {
          ...updateData,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : undefined,
        },
      });

      if (batchId) {
        const existingEnrollment = await tx.batchStudent.findUnique({
          where: {
            batchId_studentId: {
              batchId,
              studentId: id,
            },
          },
        });

        if (existingEnrollment) {
          if (rollNumber !== undefined) {
            await tx.batchStudent.update({
              where: { id: existingEnrollment.id },
              data: { rollNumber, isActive: true },
            });
          }
        } else {
          await tx.batchStudent.create({
            data: {
              batchId,
              studentId: id,
              rollNumber: rollNumber ?? null,
            },
          });
        }
      }

      return updated;
    });

    return {
      message: 'Student updated successfully',
      data: student,
    };
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    await this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Student marked inactive (soft deleted) successfully',
      data: { id, isActive: false },
    };
  }

  async getAttendanceHistory(id: string, month?: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    const where: any = { studentId: id };

    if (month) {
      // Month format: "2025-01"
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    // Summary counts
    const summary = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === 'PRESENT').length,
      absent: attendances.filter((a) => a.status === 'ABSENT').length,
      late: attendances.filter((a) => a.status === 'LATE').length,
      excused: attendances.filter((a) => a.status === 'EXCUSED').length,
    };

    return {
      message: 'Student attendance history retrieved successfully',
      data: {
        summary,
        records: attendances,
      },
    };
  }

  async getMarksHistory(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    const marks = await this.prisma.mark.findMany({
      where: { studentId: id },
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
      message: 'Student marks history retrieved successfully',
      data: marks,
    };
  }

  async getFeeHistory(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    const feeCollections = await this.prisma.feeCollection.findMany({
      where: { studentId: id },
      orderBy: { paymentDate: 'desc' },
    });

    const totalPaid = feeCollections.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalDue = feeCollections.reduce((sum, item) => sum + item.dueAmount, 0);

    return {
      message: 'Student fee collection history retrieved successfully',
      data: {
        totalPaid,
        totalDue,
        history: feeCollections,
      },
    };
  }
}
