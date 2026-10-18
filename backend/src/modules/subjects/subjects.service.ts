import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { QuerySubjectDto } from './dto/query-subject.dto.js';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(
        `Subject with code '${dto.code}' already exists`,
      );
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        classLevel: dto.classLevel?.trim(),
        group: dto.group?.trim(),
        fullMarks: dto.fullMarks ?? 100,
        passMarks: dto.passMarks ?? 33,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      message: 'Subject created successfully',
      data: subject,
    };
  }

  async findAll(query: QuerySubjectDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.classLevel) {
      where.classLevel = query.classLevel;
    }

    if (query.group) {
      where.group = query.group;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, subjects] = await Promise.all([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              teacherSubjects: true,
              batchSubjects: true,
              exams: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Subjects retrieved successfully',
      data: subjects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teacherSubjects: {
          include: {
            teacher: {
              select: {
                id: true,
                teacherId: true,
                nameEn: true,
                nameBn: true,
                designation: true,
              },
            },
          },
        },
        batchSubjects: {
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
            exams: true,
            marks: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    return {
      message: 'Subject details retrieved successfully',
      data: subject,
    };
  }

  async update(id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== subject.code) {
      const codeExists = await this.prisma.subject.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (codeExists) {
        throw new ConflictException(
          `Subject code '${dto.code}' is already in use`,
        );
      }
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.classLevel !== undefined && { classLevel: dto.classLevel?.trim() }),
        ...(dto.group !== undefined && { group: dto.group?.trim() }),
        ...(dto.fullMarks !== undefined && { fullMarks: dto.fullMarks }),
        ...(dto.passMarks !== undefined && { passMarks: dto.passMarks }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      message: 'Subject updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exams: true,
            marks: true,
            batchSubjects: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    // If linked to exams or marks, perform soft delete
    if (subject._count.exams > 0 || subject._count.marks > 0) {
      await this.prisma.subject.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Subject is linked to exams/marks. It has been marked inactive (soft-deleted).',
        data: { id, isActive: false },
      };
    }

    await this.prisma.subject.delete({ where: { id } });

    return {
      message: 'Subject deleted successfully',
      data: { id },
    };
  }
}
