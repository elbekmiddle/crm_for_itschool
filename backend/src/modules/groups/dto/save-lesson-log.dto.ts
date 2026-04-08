import { IsNotEmpty, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveLessonLogDto {
  @ApiProperty({ example: '2026-04-07' })
  @IsDateString()
  @IsNotEmpty()
  lesson_date: string;

  @ApiProperty({ example: 'NestJS modullar va DI', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  topic?: string;
}
