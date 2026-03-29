import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class GradeEntry {
  @ApiProperty()
  @IsUUID()
  student_id: string;

  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  feedback?: string;
}

export class GradeExamDto {
  @ApiProperty({ type: [GradeEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeEntry)
  grades: GradeEntry[];
}
