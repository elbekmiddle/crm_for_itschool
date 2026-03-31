import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateVacancyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  salary?: string;
}

export class ApplyVacancyDto {
  @IsString()
  @IsNotEmpty()
  vacancy_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  resume_url: string;
}
