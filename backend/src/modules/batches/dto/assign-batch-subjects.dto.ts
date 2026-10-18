import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBatchSubjectsDto {
  @ApiProperty({
    example: ['subject-uuid-1', 'subject-uuid-2'],
    description: 'Array of subject IDs to teach in this batch',
  })
  @IsArray()
  @IsNotEmpty({ message: 'subjectIds cannot be empty' })
  @IsString({ each: true })
  subjectIds: string[];
}
