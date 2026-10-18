import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { MarksService } from './marks.service.js';
import { ExamsController } from './exams.controller.js';
import { MarksController } from './marks.controller.js';

@Module({
  controllers: [ExamsController, MarksController],
  providers: [ExamsService, MarksService],
  exports: [ExamsService, MarksService],
})
export class ExamsModule {}
