import { IsArray, IsNotEmpty, IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchTeacherItem {
  @ApiProperty({ example: 'teacher-uuid-here' })
  @IsNotEmpty()
  @IsString()
  teacherId: string;

  @ApiPropertyOptional({ example: true, default: false, description: 'Is primary/class teacher' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class AssignBatchTeachersDto {
  @ApiProperty({
    type: [BatchTeacherItem],
    description: 'Array of teachers to assign to this batch',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchTeacherItem)
  teachers: BatchTeacherItem[];
}
