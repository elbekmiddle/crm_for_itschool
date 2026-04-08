import { IsString, IsNotEmpty, MinLength, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class VerifyCodeDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '482931' })
  @Transform(({ value }) => String(value ?? '').replace(/\D/g, ''))
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string;

  @ApiProperty({ example: 'mypassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}
