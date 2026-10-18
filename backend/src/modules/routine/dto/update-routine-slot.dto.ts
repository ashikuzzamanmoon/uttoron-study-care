import { PartialType } from '@nestjs/swagger';
import { CreateRoutineSlotDto } from './create-routine-slot.dto.js';

export class UpdateRoutineSlotDto extends PartialType(CreateRoutineSlotDto) {}
