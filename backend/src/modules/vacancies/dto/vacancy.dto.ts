import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateVacancyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  salary?: string;
}

export class ApplyVacancyDto {
  @IsString()
  @IsNotEmpty()
  vacancy_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  resume_url?: string;
}
