import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ConfirmForgotPasswordDto {
  @IsEmail()
  email: string;

  /** Telegram orqali yuborilgan 6 raqamli kod */
  @IsString()
  @Length(6, 6)
  code: string;

  /** Kodni tasdiqlagach yangi parol sifatida saqlanadi (mavjud oqim bilan mos) */
  @IsString()
  @MinLength(6)
  new_password: string;
}
