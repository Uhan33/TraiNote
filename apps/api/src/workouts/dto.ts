import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class WorkoutSetDto {
  @ApiProperty({ type: Number, nullable: true, example: 60 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  kg: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  reps: number | null;

  @ApiProperty()
  @IsBoolean()
  done: boolean;
}

export class ExerciseDto {
  @ApiProperty({ example: '스쿼트' })
  @IsString()
  @Length(1, 50)
  name: string;

  @ApiProperty({ type: [WorkoutSetDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WorkoutSetDto)
  sets: WorkoutSetDto[];
}

// 일지 통째로 저장(자동 저장). exercises 가 비면 그날 일지 삭제
export class SaveWorkoutDto {
  @ApiProperty({ example: '하체' })
  @IsString()
  @MaxLength(50)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  memo: string;

  @ApiProperty({ type: [ExerciseDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

export class StrengthPointDto {
  @ApiProperty({ example: '2026-10-17' }) date: string;
  @ApiProperty({ example: 60, description: '그날 이 종목의 최고 중량(kg)' }) value: number;
}

export class StrengthSeriesDto {
  @ApiProperty({ example: '스쿼트' }) name: string;
  @ApiProperty({ type: String, nullable: true, example: '하체', description: '부위. null = 기본 종목에 없는 이름(직접 입력)' }) bodyPart: string | null;
  @ApiProperty({ type: [StrengthPointDto], description: '날짜 오름차순' }) points: StrengthPointDto[];
}

export class WorkoutLogDto extends SaveWorkoutDto {
  @ApiProperty({ example: 'K7Q2XA' }) memberCode: string;
  @ApiProperty({ example: '2026-10-17' }) date: string;
  @ApiProperty({ type: String, nullable: true, description: '작성 완료 시각. null = 작성 중 (회원에게 안 보임)' }) completedAt: string | null;
}
