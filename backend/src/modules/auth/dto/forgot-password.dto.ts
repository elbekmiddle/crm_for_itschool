import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'teacher@school.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
