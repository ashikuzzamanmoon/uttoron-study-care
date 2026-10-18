import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSubjectsDto {
  @ApiProperty({
    example: ['subject-uuid-1', 'subject-uuid-2'],
    description: 'Array of Subject IDs to assign to the teacher',
  })
  @IsArray()
  @IsNotEmpty({ message: 'subjectIds array cannot be empty' })
  @IsString({ each: true })
  subjectIds: string[];
}
