import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsArray, ArrayMaxSize, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateUserDto {
  @ApiProperty({ example: 'teacher@school.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Ali', required: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Valiyev', required: false })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const t = typeof value === 'string' ? value.trim() : '';
    return t === '' ? undefined : t;
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const t = String(value).trim();
    if (!t || t === '+') return undefined;
    return t;
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'TEACHER', enum: ['ADMIN', 'MANAGER', 'TEACHER'], required: false })
  @IsEnum(['ADMIN', 'MANAGER', 'TEACHER'])
  @IsOptional()
  role?: string;

  /** TEACHER uchun: ushbu kurslarga teacher_id biriktiriladi (maks. 5) */
  @ApiProperty({ required: false, type: [String], maxItems: 5 })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return undefined;
    const cleaned = value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((id) => UUID_V4.test(id));
    return cleaned.length ? cleaned : undefined;
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  course_ids?: string[];
}
