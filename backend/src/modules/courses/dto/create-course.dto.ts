import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Node.js Backend' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 250.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration_months?: number;
}
