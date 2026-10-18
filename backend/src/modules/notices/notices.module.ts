import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller.js';
import { NoticesService } from './notices.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
