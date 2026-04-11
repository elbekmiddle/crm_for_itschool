import { IsString, IsNotEmpty, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @ApiProperty({ description: 'Title of the exam (e.g Midterm)', example: 'Midterm Javascript' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Course ID this exam belongs to' })
  @IsUUID()
  @IsNotEmpty()
  course_id: string;

  @ApiPropertyOptional({ description: 'Optional group — narrows AI context and matches class topics' })
  @IsOptional()
  @IsUUID()
  group_id?: string;

  @ApiPropertyOptional({ description: 'Imtihon davomiyligi (daqiqa)', example: 30, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  duration_minutes?: number;

  @ApiPropertyOptional({ description: "O'tish foizi (0–100)", example: 60, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passing_score?: number;
}
