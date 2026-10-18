import { Module } from '@nestjs/common';
import { RoutineService } from './routine.service.js';
import { RoutineController } from './routine.controller.js';

@Module({
  controllers: [RoutineController],
  providers: [RoutineService],
  exports: [RoutineService],
})
export class RoutineModule {}
