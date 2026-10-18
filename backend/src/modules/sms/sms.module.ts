import { Module } from '@nestjs/common';
import { SmsService } from './sms.service.js';
import { SmsCampaignService } from './sms-campaign.service.js';
import { SmsTemplateService } from './sms-template.service.js';
import { GreenwebGateway } from './gateways/greenweb.gateway.js';
import { SmsController } from './sms.controller.js';
import { SmsCampaignController } from './sms-campaign.controller.js';
import { SmsTemplateController } from './sms-template.controller.js';

@Module({
  controllers: [
    SmsController,
    SmsCampaignController,
    SmsTemplateController,
  ],
  providers: [
    SmsService,
    SmsCampaignService,
    SmsTemplateService,
    GreenwebGateway,
  ],
  exports: [
    SmsService,
    SmsCampaignService,
    SmsTemplateService,
    GreenwebGateway,
  ],
})
export class SmsModule {}
