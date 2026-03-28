import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'student_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  student_id: string;

  @ApiProperty({ example: 'group_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  amount: number;
}
