import { IsNotEmpty, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'course_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ example: 'Introduction to React' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
