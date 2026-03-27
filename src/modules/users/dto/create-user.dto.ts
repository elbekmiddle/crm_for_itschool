import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'teacher@school.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'TEACHER', enum: ['ADMIN', 'MANAGER', 'TEACHER'], required: false })
  @IsEnum(['ADMIN', 'MANAGER', 'TEACHER'])
  @IsOptional()
  role?: string;
}
