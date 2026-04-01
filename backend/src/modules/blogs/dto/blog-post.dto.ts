import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateBlogPostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: string;
}
