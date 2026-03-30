import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '4832' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'mypassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}
