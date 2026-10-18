import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class CreateUserDto {
  @ApiProperty({ description: 'Username', example: 'teacher_rahim' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'rahim@uttoron.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password', minLength: 6, example: 'Pass1234' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Role', enum: UserRole, default: UserRole.STAFF })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Status', enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Reset Password (optional)', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
