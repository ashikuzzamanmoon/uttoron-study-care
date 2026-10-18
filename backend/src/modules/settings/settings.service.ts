import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingItemDto } from './dto/setting-item.dto.js';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultSettings();
  }

  /**
   * Seed default settings if empty
   */
  async seedDefaultSettings() {
    const defaults = [
      // Institute Details
      { key: 'institute_name', value: 'উত্তরণ স্টাডি কেয়ার', group: 'institute', description: 'প্রতিষ্ঠানের বাংলা নাম' },
      { key: 'institute_name_en', value: 'Uttoron Study Care', group: 'institute', description: 'Institute English Name' },
      { key: 'institute_address', value: 'প্রধান শাখা, কাচারী রোড, ঢাকা', group: 'institute', description: 'প্রতিষ্ঠানের পূর্ণ ঠিকানা' },
      { key: 'institute_phone', value: '01712345678', group: 'institute', description: 'অফিসিয়াল হটলাইন নম্বর' },
      { key: 'institute_email', value: 'info@uttoronstudycare.com', group: 'institute', description: 'অফিসিয়াল ইমেইল' },
      { key: 'institute_motto', value: 'জ্ঞানে উত্তরণ, সাফল্যে ভবিষ্যৎ', group: 'institute', description: 'প্রতিষ্ঠানের মূল স্লোগান' },
      { key: 'institute_established', value: '২০২০', group: 'institute', description: 'প্রতিষ্ঠার সাল' },
      { key: 'institute_logo_url', value: '/images/uttoron-logo.png', group: 'institute', description: 'লোগো পাথ' },

      // SMS Gateway
      { key: 'sms_gateway_provider', value: 'GREENWEB', group: 'sms', description: 'এসএমএস গেটওয়ে প্রোভাইডার' },
      { key: 'sms_api_token', value: 'GREENWEB_TOKEN_SECRET_KEY', group: 'sms', description: 'এসএমএস এপিআই টোকেন' },
      { key: 'sms_sender_id', value: 'UttoronCare', group: 'sms', description: 'এসএমএস সেন্ডার আইডি (Masking/Non-masking)' },
      { key: 'sms_auto_attendance_absent', value: 'true', group: 'sms', description: 'অনুপস্থিতিতে অভিভাবককে অটো এসএমএস' },
      { key: 'sms_auto_fee_receipt', value: 'true', group: 'sms', description: 'ফি পরিশোধে অভিভাবককে অটো ডিজিটাল রসিদ এসএমএস' },

      // Grading System
      {
        key: 'grading_scale',
        value: JSON.stringify([
          { grade: 'A+', min: 80, max: 100, gpa: 5.0, description: 'Outstanding' },
          { grade: 'A', min: 70, max: 79, gpa: 4.0, description: 'Excellent' },
          { grade: 'A-', min: 60, max: 69, gpa: 3.5, description: 'Very Good' },
          { grade: 'B', min: 50, max: 59, gpa: 3.0, description: 'Good' },
          { grade: 'C', min: 40, max: 49, gpa: 2.0, description: 'Satisfactory' },
          { grade: 'D', min: 33, max: 39, gpa: 1.0, description: 'Pass' },
          { grade: 'F', min: 0, max: 32, gpa: 0.0, description: 'Fail' },
        ]),
        group: 'grading',
        description: 'জাতীয় শিক্ষাক্রম অনুযায়ী গ্রেডিং স্কেল',
      },
    ];

    for (const d of defaults) {
      const existing = await this.prisma.setting.findUnique({
        where: { key: d.key },
      });
      if (!existing) {
        await this.prisma.setting.create({
          data: d,
        });
      }
    }
  }

  /**
   * Get all settings, optionally filtered by group
   */
  async getAll(group?: string) {
    const where: any = {};
    if (group && group !== 'ALL') {
      where.group = group;
    }

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  /**
   * Get settings as key-value dictionary
   */
  async getDictionary(group?: string) {
    const settings = await this.getAll(group);
    const dict: Record<string, string> = {};
    for (const s of settings) {
      dict[s.key] = s.value;
    }
    return dict;
  }

  /**
   * Get single setting by key
   */
  async getByKey(key: string) {
    return this.prisma.setting.findUnique({
      where: { key },
    });
  }

  /**
   * Update or insert a single setting
   */
  async update(key: string, value: string, group?: string, description?: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: {
        value,
        group: group || undefined,
        description: description || undefined,
      },
      create: {
        key,
        value,
        group,
        description,
      },
    });

    return {
      message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে',
      data: setting,
    };
  }

  /**
   * Bulk update multiple settings
   */
  async bulkUpdate(items: SettingItemDto[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.setting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            group: item.group || undefined,
            description: item.description || undefined,
          },
          create: {
            key: item.key,
            value: item.value,
            group: item.group,
            description: item.description,
          },
        }),
      ),
    );

    return {
      message: `${items.length}টি সেটিংস সফলভাবে আপডেট করা হয়েছে`,
    };
  }
}
