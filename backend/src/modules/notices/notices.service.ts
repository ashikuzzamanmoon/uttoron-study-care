import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';
import { QueryNoticeDto } from './dto/query-notice.dto.js';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notice
   */
  async create(dto: CreateNoticeDto, user: any) {
    const createdById = user.userId || user.id;

    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        priority: dto.priority || 'NORMAL',
        isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
        publishedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'নোটিশ সফলভাবে তৈরি ও প্রকাশিত হয়েছে',
      data: notice,
    };
  }

  /**
   * Find all notices with search, filters & pagination
   */
  async findAll(query: QueryNoticeDto) {
    const { skip, take, search, priority, isPublished, activeOnly, sortBy, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (activeOnly) {
      const now = new Date();
      where.isPublished = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ];
    }

    const [total, notices] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy || 'createdAt']: sortOrder || 'desc',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: notices,
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
   * Get active and published notices for quick board/banner widgets
   */
  async getActiveNotices(limit = 10) {
    const now = new Date();

    const notices = await this.prisma.notice.findMany({
      where: {
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return notices;
  }

  /**
   * Get single notice by ID
   */
  async findOne(id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException(`আইডি '${id}' বিশিষ্ট কোনো নোটিশ পাওয়া যায়নি`);
    }

    return notice;
  }

  /**
   * Update notice details
   */
  async update(id: string, dto: UpdateNoticeDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.body !== undefined) updateData.body = dto.body.trim();
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    const updated = await this.prisma.notice.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'নোটিশ সফলভাবে আপডেট করা হয়েছে',
      data: updated,
    };
  }

  /**
   * Toggle notice publish status
   */
  async togglePublish(id: string, isPublished?: boolean) {
    const notice = await this.findOne(id);
    const newStatus = isPublished !== undefined ? isPublished : !notice.isPublished;

    const updated = await this.prisma.notice.update({
      where: { id },
      data: {
        isPublished: newStatus,
        publishedAt: newStatus ? new Date() : notice.publishedAt,
      },
    });

    return {
      message: newStatus ? 'নোটিশটি সফলভাবে প্রকাশ করা হয়েছে' : 'নোটিশটির প্রকাশনা স্থগিত করা হয়েছে',
      data: updated,
    };
  }

  /**
   * Delete notice
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.notice.delete({
      where: { id },
    });

    return {
      message: 'নোটিশটি সফলভাবে মুছে ফেলা হয়েছে',
    };
  }
}
