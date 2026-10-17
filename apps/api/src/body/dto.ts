import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SaveBodyRecordDto {
  @ApiProperty({ example: 72.4 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '체중은 숫자로 입력하세요' })
  @Min(10, { message: '체중은 10~400kg 사이로 입력하세요' })
  @Max(400, { message: '체중은 10~400kg 사이로 입력하세요' })
  weightKg: number;

  @ApiProperty({ type: Number, nullable: true, required: false, example: 22.1, description: '체지방률(%) — 선택' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 }, { message: '체지방률은 숫자로 입력하세요' })
  @Min(1, { message: '체지방률은 1~75% 사이로 입력하세요' })
  @Max(75, { message: '체지방률은 1~75% 사이로 입력하세요' })
  bodyFatPct?: number | null;

  @ApiProperty({ type: Number, nullable: true, required: false, example: 28.4, description: '골격근량(kg) — 선택' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '골격근량은 숫자로 입력하세요' })
  @Min(5, { message: '골격근량은 5~100kg 사이로 입력하세요' })
  @Max(100, { message: '골격근량은 5~100kg 사이로 입력하세요' })
  skeletalMuscleKg?: number | null;
}

export class BodyRecordDto {
  @ApiProperty({ example: '2026-10-17' }) date: string;
  @ApiProperty({ example: 72.4 }) weightKg: number;
  @ApiProperty({ type: Number, nullable: true, example: 22.1 }) bodyFatPct: number | null;
  @ApiProperty({ type: Number, nullable: true, example: 28.4 }) skeletalMuscleKg: number | null;
}
