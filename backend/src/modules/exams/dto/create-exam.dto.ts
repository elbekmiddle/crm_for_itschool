import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
