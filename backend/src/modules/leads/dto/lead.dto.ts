import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  parent_name?: string;

  @IsString()
  @IsOptional()
  course_id?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
