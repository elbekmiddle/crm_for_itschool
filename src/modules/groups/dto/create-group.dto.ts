import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'N-1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'course_uuid_here' })
  @IsUUID('4')
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ example: 'teacher_uuid_here' })
  @IsUUID('4')
  @IsNotEmpty()
  teacher_id: string;
}

export class GroupStudentDto {
  @ApiProperty({ example: 'student_uuid_here' })
  @IsUUID('4')
  @IsNotEmpty()
  student_id: string;
}
