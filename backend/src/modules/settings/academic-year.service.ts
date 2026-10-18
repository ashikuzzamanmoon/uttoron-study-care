import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAcademicYearDto } from './dto/academic-year.dto.js';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all academic years
   */
  async findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { name: 'desc' },
    });
  }

  /**
   * Create new academic year
   */
  async create(dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`'${dto.name}' শিক্ষাবর্ষ ইতিমধ্যে বিদ্যমান`);
    }

    if (dto.isCurrent) {
      // Unset any currently active academic year
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const year = await this.prisma.academicYear.create({
      data: {
        name: dto.name.trim(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent || false,
      },
    });

    return {
      message: 'শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে',
      data: year,
    };
  }

  /**
   * Set academic year as current active year
   */
  async setCurrent(id: string) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('শিক্ষাবর্ষ পাওয়া যায়নি');
    }

    // Set all to false, then set target to true
    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        data: { isCurrent: false },
      }),
      this.prisma.academicYear.update({
        where: { id },
        data: { isCurrent: true },
      }),
    ]);

    return {
      message: `'${existing.name}' শিক্ষাবর্ষকে বর্তমান সক্রিয় বছর হিসেবে নির্ধারণ করা হয়েছে`,
    };
  }

  /**
   * Remove academic year
   */
  async remove(id: string) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('শিক্ষাবর্ষ পাওয়া যায়নি');
    }

    await this.prisma.academicYear.delete({
      where: { id },
    });

    return {
      message: 'শিক্ষাবর্ষ সফলভাবে মুছে ফেলা হয়েছে',
    };
  }
}
