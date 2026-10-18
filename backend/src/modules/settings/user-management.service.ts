import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user-management.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find users with search, role and status filters
   */
  async findAll(query: QueryUserDto) {
    const { skip, take, search, role, status, sortBy, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy || 'createdAt']: sortOrder || 'desc',
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          teacher: {
            select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true },
          },
          student: {
            select: { id: true, studentId: true, nameEn: true, nameBn: true, phone: true },
          },
        },
      }),
    ]);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Create a new user account (Staff, Teacher, Admin)
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username.trim() },
          ...(dto.email ? [{ email: dto.email.trim() }] : []),
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('ইউজারনেম অথবা ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username.trim(),
        email: dto.email ? dto.email.trim() : null,
        password: hashedPassword,
        role: dto.role,
        status: dto.status || 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      message: 'ইউজার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে',
      data: user,
    };
  }

  /**
   * Update user details (Role, Status, Password reset)
   */
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('ইউজার পাওয়া যায়নি');
    }

    const updateData: any = {};
    if (dto.email !== undefined) updateData.email = dto.email ? dto.email.trim() : null;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.newPassword) {
      updateData.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: 'ইউজার তথ্য সফলভাবে আপডেট করা হয়েছে',
      data: updated,
    };
  }

  /**
   * Delete user account
   */
  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('নিজের অ্যাকাউন্ট নিজে মুছে ফেলা সম্ভব নয়');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('ইউজার পাওয়া যায়নি');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('সিস্টেমের একমাত্র সুপার অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না');
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে',
    };
  }
}
