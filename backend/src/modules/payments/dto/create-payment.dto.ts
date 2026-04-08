import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({ example: 'student_uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  student_id: string;

  @ApiProperty({ example: 'group_uuid', required: false, description: 'Bo‘sh bo‘lsa, talabaning faol guruhi avtomatik tanlanadi' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID('4')
  group_id?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'cash', required: false })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
