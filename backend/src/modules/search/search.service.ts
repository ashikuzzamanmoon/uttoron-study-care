import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search across all core coaching modules
   */
  async globalSearch(searchTerm: string) {
    const q = searchTerm?.trim();
    if (!q || q.length < 2) {
      return {
        query: q || '',
        totalResults: 0,
        results: {
          students: [],
          teachers: [],
          batches: [],
          exams: [],
          notices: [],
          fees: [],
        },
      };
    }

    const [students, teachers, batches, exams, notices, fees] = await Promise.all([
      // 1. Students
      this.prisma.student.findMany({
        where: {
          OR: [
            { nameEn: { contains: q, mode: 'insensitive' } },
            { nameBn: { contains: q, mode: 'insensitive' } },
            { studentId: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { guardianPhone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          studentId: true,
          nameEn: true,
          nameBn: true,
          classLevel: true,
          phone: true,
          guardianPhone: true,
        },
      }),

      // 2. Teachers
      this.prisma.teacher.findMany({
        where: {
          OR: [
            { nameEn: { contains: q, mode: 'insensitive' } },
            { nameBn: { contains: q, mode: 'insensitive' } },
            { teacherId: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          teacherId: true,
          nameEn: true,
          nameBn: true,
          phone: true,
          designation: true,
        },
      }),

      // 3. Batches
      this.prisma.batch.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { classLevel: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          classLevel: true,
          year: true,
        },
      }),

      // 4. Exams
      this.prisma.exam.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          examDate: true,
          subject: { select: { name: true } },
          batch: { select: { name: true } },
        },
      }),

      // 5. Notices
      this.prisma.notice.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          publishedAt: true,
        },
      }),

      // 6. Fee Collections (by receiptNo)
      this.prisma.feeCollection.findMany({
        where: {
          receiptNo: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          receiptNo: true,
          paidAmount: true,
          paymentDate: true,
          student: {
            select: { nameEn: true, nameBn: true, studentId: true },
          },
        },
      }),
    ]);

    const totalResults =
      students.length +
      teachers.length +
      batches.length +
      exams.length +
      notices.length +
      fees.length;

    return {
      query: q,
      totalResults,
      results: {
        students,
        teachers,
        batches,
        exams,
        notices,
        fees,
      },
    };
  }
}
