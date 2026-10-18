import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISmsGateway,
  SmsResponse,
  SmsRecipientPayload,
} from './sms-gateway.interface.js';

@Injectable()
export class GreenwebGateway implements ISmsGateway {
  private readonly logger = new Logger(GreenwebGateway.name);
  private readonly gatewayUrl: string;
  private readonly token: string;
  private readonly senderId: string;
  private readonly isMock: boolean;

  constructor(private readonly config: ConfigService) {
    this.gatewayUrl =
      this.config.get<string>('SMS_GATEWAY_URL') ||
      'http://api.greenweb.com.bd/api.php';
    this.token = this.config.get<string>('SMS_GATEWAY_API_KEY') || '';
    this.senderId = this.config.get<string>('SMS_SENDER_ID') || 'UTTORON';

    // If no real API key is configured or set to dummy, operate in mock mode
    this.isMock =
      !this.token ||
      this.token === 'your-sms-api-key' ||
      this.token.startsWith('mock-');

    if (this.isMock) {
      this.logger.warn(
        'SMS Gateway operates in DEV/MOCK mode. Real SMS will not be billed.',
      );
    }
  }

  /**
   * Format phone number to Bangladeshi 11-digit or 880 format
   */
  private normalizePhone(phone: string): string {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('880')) return clean;
    if (clean.startsWith('01')) return `88${clean}`;
    return clean;
  }

  /**
   * Send single SMS
   */
  async sendSingle(phone: string, message: string): Promise<SmsResponse> {
    const formattedPhone = this.normalizePhone(phone);

    if (this.isMock) {
      this.logger.log(
        `[MOCK SMS SEND] To: ${formattedPhone} | Text: "${message}"`,
      );
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        rawResponse: 'Mock delivery success',
      };
    }

    try {
      const url = new URL(this.gatewayUrl);
      url.searchParams.append('token', this.token);
      url.searchParams.append('to', formattedPhone);
      url.searchParams.append('message', message);
      if (this.senderId) {
        url.searchParams.append('senderid', this.senderId);
      }

      const res = await fetch(url.toString(), { method: 'GET' });
      const text = await res.text();

      if (
        res.ok &&
        (text.toLowerCase().includes('ok') ||
          text.toLowerCase().includes('success') ||
          text.includes('100'))
      ) {
        return {
          success: true,
          messageId: text,
          rawResponse: text,
        };
      }

      this.logger.error(`SMS gateway returned error: ${text}`);
      return {
        success: false,
        error: text,
        rawResponse: text,
      };
    } catch (err: any) {
      this.logger.error(`Failed to reach SMS gateway: ${err.message}`);
      return {
        success: false,
        error: err.message || 'SMS Gateway unreachable',
      };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(recipients: SmsRecipientPayload[]): Promise<SmsResponse[]> {
    const results: SmsResponse[] = [];
    for (const item of recipients) {
      const res = await this.sendSingle(item.phone, item.message);
      results.push(res);
      // Brief delay to prevent rate limit spikes
      await new Promise((r) => setTimeout(r, 50));
    }
    return results;
  }

  /**
   * Check SMS Gateway Balance
   */
  async checkBalance(): Promise<number> {
    if (this.isMock) {
      return 1500; // Simulated available balance
    }

    try {
      const url = `${this.gatewayUrl}?token=${encodeURIComponent(
        this.token,
      )}&balance`;
      const res = await fetch(url);
      const text = await res.text();
      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    } catch {
      return 0;
    }
  }
}
