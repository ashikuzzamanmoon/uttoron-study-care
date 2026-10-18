import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { AcademicYearService } from './academic-year.service.js';
import { UserManagementController } from './user-management.controller.js';
import { UserManagementService } from './user-management.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController, UserManagementController],
  providers: [SettingsService, AcademicYearService, UserManagementService],
  exports: [SettingsService, AcademicYearService, UserManagementService],
})
export class SettingsModule {}
