import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class StudentLoginDto {
  @ApiProperty({ description: 'Student phone number', example: '+998901234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Student first name (used as a simple password check)', example: 'Ali' })
  @IsNotEmpty()
  @IsString()
  first_name: string;
}
