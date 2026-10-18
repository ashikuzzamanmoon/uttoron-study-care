import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GreenwebGateway } from './gateways/greenweb.gateway.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { SmsStatus, SmsType } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class SmsCampaignService {
  private readonly logger = new Logger(SmsCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GreenwebGateway,
  ) {}

  /**
   * Helper: Normalize Bangladeshi phone number
   */
  private normalizePhone(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('880')) return clean;
    if (clean.startsWith('01')) return `88${clean}`;
    return clean;
  }

  /**
   * 1. Create a new campaign (Draft or with recipients)
   */
  async createCampaign(dto: CreateCampaignDto) {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;

    // Filter recipients if provided
    const validRecipients: { phone: string; name?: string; studentId?: string }[] = [];
    if (dto.recipients && dto.recipients.length > 0) {
      for (const r of dto.recipients) {
        const norm = this.normalizePhone(r.phone);
        if (norm && norm.length >= 11) {
          validRecipients.push({
            phone: norm,
            name: r.name || null || undefined,
            studentId: r.studentId || undefined,
          });
        }
      }
    }

    const campaign = await this.prisma.smsCampaign.create({
      data: {
        name: dto.name,
        message: dto.message,
        totalRecipients: validRecipients.length,
        status: 'DRAFT',
        scheduledAt,
        recipients: {
          create: validRecipients.map((r) => ({
            phone: r.phone,
            name: r.name || null,
            message: dto.message,
            studentId: r.studentId || null,
            status: SmsStatus.PENDING,
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    return {
      message: 'এসএমএস ক্যাম্পেইন সফলভাবে তৈরি হয়েছে',
      data: campaign,
    };
  }

  /**
   * 2. Parse Excel/CSV file to extract phone numbers and contact names
   */
  async uploadContacts(file: { buffer: Buffer; originalname?: string }) {
    if (!file || !file.buffer) {
      throw new BadRequestException('অনুগ্রহ করে একটি এক্সেল বা সিএসভি ফাইল আপলোড করুন');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length === 0) {
        throw new BadRequestException('ফাইলটিতে কোনো ডাটা পাওয়া যায়নি');
      }

      // Detect header row
      const headerRow: string[] = rows[0].map((cell: any) => String(cell).toLowerCase().trim());
      let phoneColIdx = -1;
      let nameColIdx = -1;

      for (let i = 0; i < headerRow.length; i++) {
        const col = headerRow[i];
        if (
          col.includes('phone') ||
          col.includes('mobile') ||
          col.includes('cell') ||
          col.includes('ফোন') ||
          col.includes('মোবাইল') ||
          col.includes('নাম্বার')
        ) {
          phoneColIdx = i;
        }
        if (col.includes('name') || col.includes('নাম')) {
          nameColIdx = i;
        }
      }

      // Default to column 0 if no header found
      if (phoneColIdx === -1) phoneColIdx = 0;

      const contactsMap = new Map<string, string>();
      const startRow = headerRow.some((h) => h.includes('phone') || h.includes('নাম')) ? 1 : 0;

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const rawPhone = row[phoneColIdx] !== undefined ? String(row[phoneColIdx]) : '';
        const norm = this.normalizePhone(rawPhone);
        if (norm && norm.length >= 11) {
          const rawName = nameColIdx !== -1 && row[nameColIdx] ? String(row[nameColIdx]).trim() : '';
          contactsMap.set(norm, rawName);
        }
      }

      const parsedContacts = Array.from(contactsMap.entries()).map(([phone, name]) => ({
        phone,
        name: name || undefined,
      }));

      return {
        message: `ফাইল থেকে সফলভাবে ${parsedContacts.length} টি অনন্য নম্বর এক্সট্রাক্ট করা হয়েছে`,
        totalCount: parsedContacts.length,
        contacts: parsedContacts,
      };
    } catch (err: any) {
      throw new BadRequestException(`ফাইল প্রসেসিং ব্যর্থ: ${err.message}`);
    }
  }

  /**
   * 3. Execute SMS Campaign (Dispatch in background)
   */
  async executeCampaign(campaignId: string) {
    const campaign = await this.prisma.smsCampaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`ক্যাম্পেইন আইডি '${campaignId}' পাওয়া যায়নি`);
    }

    if (campaign.recipients.length === 0) {
      throw new BadRequestException('এই ক্যাম্পেইনে কোনো প্রাপক বা মোবাইল নম্বর নেই');
    }

    // Set status to SENDING
    await this.prisma.smsCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    let sent = 0;
    let failed = 0;

    for (const recipient of campaign.recipients) {
      if (recipient.status === SmsStatus.SENT) {
        sent++;
        continue;
      }

      try {
        const res = await this.gateway.sendSingle(recipient.phone, campaign.message);
        const status = res.success ? SmsStatus.SENT : SmsStatus.FAILED;

        if (res.success) sent++;
        else failed++;

        await this.prisma.smsRecipient.update({
          where: { id: recipient.id },
          data: {
            status,
            gatewayResponse: res.rawResponse ? String(res.rawResponse) : res.error,
            sentAt: res.success ? new Date() : null,
          },
        });

        // Also add entry to global SmsLog
        await this.prisma.smsLog.create({
          data: {
            phone: recipient.phone,
            message: campaign.message,
            type: SmsType.CAMPAIGN,
            status,
            gatewayResponse: res.rawResponse ? String(res.rawResponse) : res.error,
            sentAt: res.success ? new Date() : null,
          },
        });
      } catch {
        failed++;
        await this.prisma.smsRecipient.update({
          where: { id: recipient.id },
          data: { status: SmsStatus.FAILED },
        });
      }

      // Small throttle to avoid gateway congestion
      await new Promise((r) => setTimeout(r, 60));
    }

    // Update campaign summary
    const updatedCampaign = await this.prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status: failed === campaign.recipients.length ? 'FAILED' : 'COMPLETED',
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
      },
    });

    return {
      message: 'ক্যাম্পেইন সফলভাবে সম্পন্ন হয়েছে',
      data: updatedCampaign,
    };
  }

  /**
   * 4. List Campaigns
   */
  async getCampaigns(page = 1, limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, records] = await Promise.all([
      this.prisma.smsCampaign.count(),
      this.prisma.smsCampaign.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
      data: records,
    };
  }

  /**
   * 5. Get Campaign detail with recipient status
   */
  async getCampaignById(id: string) {
    const campaign = await this.prisma.smsCampaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100, // sample of recipients
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`ক্যাম্পেইন আইডি '${id}' পাওয়া যায়নি`);
    }

    return campaign;
  }

  /**
   * 6. Delete Campaign
   */
  async deleteCampaign(id: string) {
    await this.getCampaignById(id);

    await this.prisma.smsCampaign.delete({
      where: { id },
    });

    return {
      message: 'ক্যাম্পেইন সফলভাবে মুছে ফেলা হয়েছে',
    };
  }
}
