import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRoutineSlotDto } from './dto/create-routine-slot.dto.js';
import { UpdateRoutineSlotDto } from './dto/update-routine-slot.dto.js';
import { QueryRoutineDto } from './dto/query-routine.dto.js';
import { BulkRoutineSlotsDto } from './dto/bulk-routine-slots.dto.js';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class RoutineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to validate time overlap between two intervals (HH:MM strings)
   */
  private isOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
    return startA < endB && endA > startB;
  }

  /**
   * Validates conflicts (batch overlap, teacher overlap, classroom overlap)
   */
  async checkConflicts(params: {
    batchId: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    teacherId?: string | null;
    roomNo?: string | null;
    excludeSlotId?: string;
  }) {
    if (params.startTime >= params.endTime) {
      throw new BadRequestException('ক্লাস শুরুর সময় অবশ্যই শেষ হওয়ার সময়ের চেয়ে আগে হতে হবে');
    }

    // 1. Check Batch conflict (Same batch cannot have 2 classes at same time)
    const batchSlots = await this.prisma.routineSlot.findMany({
      where: {
        batchId: params.batchId,
        day: params.day,
        ...(params.excludeSlotId ? { id: { not: params.excludeSlotId } } : {}),
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    for (const slot of batchSlots) {
      if (this.isOverlapping(slot.startTime, slot.endTime, params.startTime, params.endTime)) {
        throw new BadRequestException(
          `এই ব্যাচে ${slot.day} বারে ${slot.startTime}-${slot.endTime} সময়ে ইতিমধ্যে ${slot.subject?.name || 'একটি ক্লাস'} শিডিউল করা আছে।`,
        );
      }
    }

    // 2. Check Teacher conflict (Same teacher cannot teach 2 batches at same time)
    if (params.teacherId) {
      const teacherSlots = await this.prisma.routineSlot.findMany({
        where: {
          teacherId: params.teacherId,
          day: params.day,
          ...(params.excludeSlotId ? { id: { not: params.excludeSlotId } } : {}),
        },
        include: {
          batch: { select: { name: true } },
          teacher: { select: { nameBn: true, nameEn: true } },
        },
      });

      for (const slot of teacherSlots) {
        if (this.isOverlapping(slot.startTime, slot.endTime, params.startTime, params.endTime)) {
          const teacherName = slot.teacher?.nameBn || slot.teacher?.nameEn || 'এই শিক্ষক';
          throw new BadRequestException(
            `${teacherName}-এর ${slot.day} বারে ${slot.startTime}-${slot.endTime} সময়ে "${slot.batch?.name}" ব্যাচে অন্য ক্লাস রয়েছে।`,
          );
        }
      }
    }

    // 3. Check Classroom conflict (Same room cannot host 2 classes at same time)
    if (params.roomNo && params.roomNo.trim()) {
      const roomSlots = await this.prisma.routineSlot.findMany({
        where: {
          roomNo: params.roomNo.trim(),
          day: params.day,
          ...(params.excludeSlotId ? { id: { not: params.excludeSlotId } } : {}),
        },
        include: {
          batch: { select: { name: true } },
        },
      });

      for (const slot of roomSlots) {
        if (this.isOverlapping(slot.startTime, slot.endTime, params.startTime, params.endTime)) {
          throw new BadRequestException(
            `রুম "${params.roomNo}"-এ ${slot.day} বারে ${slot.startTime}-${slot.endTime} সময়ে "${slot.batch?.name}" ব্যাচের ক্লাস নির্ধারিত আছে।`,
          );
        }
      }
    }
  }

  async create(dto: CreateRoutineSlotDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${dto.batchId}' পাওয়া যায়নি`);
    }

    await this.checkConflicts({
      batchId: dto.batchId,
      day: dto.day,
      startTime: dto.startTime,
      endTime: dto.endTime,
      teacherId: dto.teacherId,
      roomNo: dto.roomNo,
    });

    const slot = await this.prisma.routineSlot.create({
      data: {
        batchId: dto.batchId,
        subjectId: dto.subjectId || null,
        teacherId: dto.teacherId || null,
        day: dto.day,
        startTime: dto.startTime,
        endTime: dto.endTime,
        roomNo: dto.roomNo?.trim() || null,
      },
      include: {
        batch: { select: { id: true, name: true, classLevel: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true } },
      },
    });

    return {
      message: 'ক্লাস রুটিন স্লট সফলভাবে তৈরি হয়েছে',
      data: slot,
    };
  }

  async findAll(query: QueryRoutineDto) {
    const where: any = {};

    if (query.batchId) where.batchId = query.batchId;
    if (query.day) where.day = query.day;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.roomNo) where.roomNo = query.roomNo;

    const slots = await this.prisma.routineSlot.findMany({
      where,
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      include: {
        batch: { select: { id: true, name: true, classLevel: true, group: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true } },
      },
    });

    return {
      message: 'রুটিন স্লট তালিকা সফলভাবে লোড হয়েছে',
      data: slots,
    };
  }

  async findOne(id: string) {
    const slot = await this.prisma.routineSlot.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true, classLevel: true, group: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true } },
      },
    });

    if (!slot) {
      throw new NotFoundException(`রুটিন স্লট '${id}' খুঁজে পাওয়া যায়নি`);
    }

    return {
      message: 'রুটিন স্লট বিস্তারিত',
      data: slot,
    };
  }

  async findByBatch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true, classLevel: true, group: true, section: true, year: true },
    });

    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${batchId}' পাওয়া যায়নি`);
    }

    const slots = await this.prisma.routineSlot.findMany({
      where: { batchId },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true } },
      },
    });

    return {
      message: 'ব্যাচের পূর্ণাঙ্গ রুটিন সফলভাবে লোড হয়েছে',
      data: {
        batch,
        slots,
      },
    };
  }

  async update(id: string, dto: UpdateRoutineSlotDto) {
    const existing = await this.prisma.routineSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`রুটিন স্লট '${id}' খুঁজে পাওয়া যায়নি`);
    }

    const batchId = dto.batchId || existing.batchId;
    const day = dto.day || existing.day;
    const startTime = dto.startTime || existing.startTime;
    const endTime = dto.endTime || existing.endTime;
    const teacherId = dto.teacherId !== undefined ? dto.teacherId : existing.teacherId;
    const roomNo = dto.roomNo !== undefined ? dto.roomNo : existing.roomNo;

    await this.checkConflicts({
      batchId,
      day,
      startTime,
      endTime,
      teacherId,
      roomNo,
      excludeSlotId: id,
    });

    const updated = await this.prisma.routineSlot.update({
      where: { id },
      data: {
        batchId,
        subjectId: dto.subjectId !== undefined ? dto.subjectId : existing.subjectId,
        teacherId,
        day,
        startTime,
        endTime,
        roomNo: roomNo?.trim() || null,
      },
      include: {
        batch: { select: { id: true, name: true, classLevel: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, teacherId: true, nameEn: true, nameBn: true, phone: true } },
      },
    });

    return {
      message: 'রুটিন স্লট সফলভাবে হালনাগাদ করা হয়েছে',
      data: updated,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.routineSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`রুটিন স্লট '${id}' পাওয়া যায়নি`);
    }

    await this.prisma.routineSlot.delete({
      where: { id },
    });

    return {
      message: 'রুটিন স্লট সফলভাবে মুছে ফেলা হয়েছে',
    };
  }

  /**
   * Bulk save/replace routine slots for a batch
   */
  async bulkSave(dto: BulkRoutineSlotsDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });

    if (!batch) {
      throw new NotFoundException(`ব্যাচ আইডি '${dto.batchId}' পাওয়া যায়নি`);
    }

    // Validate internal overlaps among the submitted slots
    for (let i = 0; i < dto.slots.length; i++) {
      const slotA = dto.slots[i];
      if (slotA.startTime >= slotA.endTime) {
        throw new BadRequestException(
          `স্লট ${i + 1}-এ শুরুর সময় (${slotA.startTime}) শেষ সময়ের চেয়ে পরে দেওয়া হয়েছে`,
        );
      }
      for (let j = i + 1; j < dto.slots.length; j++) {
        const slotB = dto.slots[j];
        if (slotA.day === slotB.day) {
          if (this.isOverlapping(slotA.startTime, slotA.endTime, slotB.startTime, slotB.endTime)) {
            throw new BadRequestException(
              `${slotA.day} বারে ${slotA.startTime} এবং ${slotB.startTime} স্লটের মধ্যে সময়ের ওভারল্যাপ রয়েছে।`,
            );
          }
        }
      }
    }

    // Validate external overlaps for each slot
    for (const slot of dto.slots) {
      // Check teacher conflict across other batches
      if (slot.teacherId) {
        const otherSlots = await this.prisma.routineSlot.findMany({
          where: {
            teacherId: slot.teacherId,
            day: slot.day,
            batchId: { not: dto.batchId }, // only check outside this batch
          },
          include: {
            batch: { select: { name: true } },
            teacher: { select: { nameBn: true, nameEn: true } },
          },
        });

        for (const os of otherSlots) {
          if (this.isOverlapping(os.startTime, os.endTime, slot.startTime, slot.endTime)) {
            const tName = os.teacher?.nameBn || os.teacher?.nameEn || 'এই শিক্ষক';
            throw new BadRequestException(
              `${tName}-এর ${slot.day} বারে ${slot.startTime}-${slot.endTime} সময়ে "${os.batch?.name}" ব্যাচে ইতিমধ্যে ক্লাস রয়েছে।`,
            );
          }
        }
      }

      // Check room conflict across other batches
      if (slot.roomNo && slot.roomNo.trim()) {
        const otherRoomSlots = await this.prisma.routineSlot.findMany({
          where: {
            roomNo: slot.roomNo.trim(),
            day: slot.day,
            batchId: { not: dto.batchId },
          },
          include: {
            batch: { select: { name: true } },
          },
        });

        for (const ors of otherRoomSlots) {
          if (this.isOverlapping(ors.startTime, ors.endTime, slot.startTime, slot.endTime)) {
            throw new BadRequestException(
              `রুম "${slot.roomNo}"-এ ${slot.day} বারে ${slot.startTime}-${slot.endTime} সময়ে "${ors.batch?.name}" ব্যাচের ক্লাস নির্ধারিত আছে।`,
            );
          }
        }
      }
    }

    // Replace in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete existing slots for this batch
      await tx.routineSlot.deleteMany({
        where: { batchId: dto.batchId },
      });

      // Insert new slots
      if (dto.slots.length > 0) {
        await tx.routineSlot.createMany({
          data: dto.slots.map((s) => ({
            batchId: dto.batchId,
            subjectId: s.subjectId || null,
            teacherId: s.teacherId || null,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            roomNo: s.roomNo?.trim() || null,
          })),
        });
      }
    });

    return this.findByBatch(dto.batchId);
  }
}
