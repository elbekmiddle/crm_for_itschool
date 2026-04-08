import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, Min } from 'class-validator';
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

  @ApiProperty({ example: 20, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 20, required: false, description: 'Frontend: max_students' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  max_students?: number;

  @ApiProperty({ example: 'Du, Se (14:00)', required: false })
  @IsString()
  @IsOptional()
  schedule?: string;
}

export class GroupStudentDto {
  @ApiProperty({ example: 'student_uuid_here' })
  @IsUUID('4')
  @IsNotEmpty()
  student_id: string;
}
