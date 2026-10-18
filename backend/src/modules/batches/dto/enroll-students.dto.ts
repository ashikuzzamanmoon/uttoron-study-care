import { IsArray, IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentEnrollmentItem {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  rollNumber?: number;
}

export class EnrollStudentsDto {
  @ApiProperty({
    type: [StudentEnrollmentItem],
    description: 'Array of student IDs with optional roll numbers',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentEnrollmentItem)
  students: StudentEnrollmentItem[];
}
