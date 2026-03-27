import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ description: 'Title of the exam (e.g Midterm)', example: 'Midterm Javascript' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Course ID this exam belongs to' })
  @IsUUID()
  @IsNotEmpty()
  course_id: string;
}
