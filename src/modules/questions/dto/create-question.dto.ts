import { IsNotEmpty, IsUUID, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'lesson_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  lesson_id: string;

  @ApiProperty({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: 'What is a closure in JavaScript?' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
