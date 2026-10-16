import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class SaveBodyRecordDto {
  @ApiProperty({ example: 72.4 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '체중은 숫자로 입력하세요' })
  @Min(10, { message: '체중은 10~400kg 사이로 입력하세요' })
  @Max(400, { message: '체중은 10~400kg 사이로 입력하세요' })
  weightKg: number;
}

export class BodyRecordDto {
  @ApiProperty({ example: '2026-10-17' }) date: string;
  @ApiProperty({ example: 72.4 }) weightKg: number;
}
