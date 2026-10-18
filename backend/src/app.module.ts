import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SubjectsModule } from './modules/subjects/subjects.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { TeachersModule } from './modules/teachers/teachers.module.js';
import { BatchesModule } from './modules/batches/batches.module.js';
import { RoutineModule } from './modules/routine/routine.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { SmsModule } from './modules/sms/sms.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    SubjectsModule,
    StudentsModule,
    TeachersModule,
    BatchesModule,
    RoutineModule,
    AttendanceModule,
    ExamsModule,
    AccountsModule,
    SmsModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
