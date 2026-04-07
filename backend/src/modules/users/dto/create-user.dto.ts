import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsArray, ArrayMaxSize, IsUUID } from 'class-validator';
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

  @ApiProperty({ example: 'Ali', required: true })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Valiyev', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'TEACHER', enum: ['ADMIN', 'MANAGER', 'TEACHER'], required: false })
  @IsEnum(['ADMIN', 'MANAGER', 'TEACHER'])
  @IsOptional()
  role?: string;

  /** TEACHER uchun: ushbu kurslarga teacher_id biriktiriladi (maks. 5) */
  @ApiProperty({ required: false, type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  course_ids?: string[];
}
