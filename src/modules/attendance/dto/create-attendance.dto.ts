import { IsNotEmpty, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'group_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ example: 'student_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  student_id: string;

  @ApiProperty({ example: 'PRESENT', enum: ['PRESENT', 'ABSENT'] })
  @IsEnum(['PRESENT', 'ABSENT'])
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'lesson_uuid', required: false })
  @IsUUID('4')
  @IsOptional()
  lesson_id?: string;
}
