import { Module } from '@nestjs/common';
import { FeesService } from './fees.service.js';
import { ExpensesService } from './expenses.service.js';
import { AccountsService } from './accounts.service.js';
import { FeesController } from './fees.controller.js';
import { ExpensesController } from './expenses.controller.js';
import { AccountsController } from './accounts.controller.js';

@Module({
  controllers: [FeesController, ExpensesController, AccountsController],
  providers: [FeesService, ExpensesService, AccountsService],
  exports: [FeesService, ExpensesService, AccountsService],
})
export class AccountsModule {}
