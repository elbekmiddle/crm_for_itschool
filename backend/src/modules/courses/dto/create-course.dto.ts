import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Node.js Backend' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 250.00 })
  @IsNumber()
  @Min(0)
  price: number;
}
