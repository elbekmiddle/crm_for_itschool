import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string; // JSON stringified rich content blocks

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}

export class UpdateBlogPostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string; // JSON stringified rich content blocks

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
