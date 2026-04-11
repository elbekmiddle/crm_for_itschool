import { IsString, IsNotEmpty, IsUUID, IsOptional, IsInt, Min, Max, IsArray, ArrayMaxSize } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Guruhga kirmagan alohida talabalar (ustoz kursi), maksimal 4 ta — guruh tanlanmagan bo‘lsa majburiy',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(4)
  individual_student_ids?: string[];

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
