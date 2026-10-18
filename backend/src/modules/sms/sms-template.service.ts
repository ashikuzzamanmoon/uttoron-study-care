import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { SmsType } from '@prisma/client';

@Injectable()
export class SmsTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Replace template variables {{variable}} with actual values
   */
  renderTemplate(templateBody: string, variables: Record<string, any>): string {
    let rendered = templateBody;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value !== undefined && value !== null ? String(value) : '');
    }
    return rendered;
  }

  async create(dto: CreateTemplateDto) {
    const template = await this.prisma.smsTemplate.create({
      data: {
        name: dto.name,
        body: dto.body,
        type: dto.type || SmsType.TRANSACTIONAL,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      message: 'এসএমএস টেমপ্লেট সফলভাবে তৈরি হয়েছে',
      data: template,
    };
  }

  async findAll(type?: SmsType) {
    const where: any = {};
    if (type) {
      where.type = type;
    }

    return this.prisma.smsTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.smsTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`টেমপ্লেট আইডি '${id}' পাওয়া যায়নি`);
    }

    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);

    const updated = await this.prisma.smsTemplate.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'এসএমএস টেমপ্লেট সফলভাবে আপডেট করা হয়েছে',
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.smsTemplate.delete({
      where: { id },
    });

    return {
      message: 'এসএমএস টেমপ্লেট সফলভাবে মুছে ফেলা হয়েছে',
    };
  }
}
