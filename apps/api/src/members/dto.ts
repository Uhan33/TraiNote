import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: '홍길동' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 20, { message: '이름은 1~20자로 입력하세요' })
  name: string;

  @ApiPropertyOptional({ example: '오전반 · 무릎 부상 이력', description: '트레이너만 보는 메모' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '메모는 500자 이내로 입력하세요' })
  memo?: string;
}

export class CreateMemberWithPtDto extends CreateMemberDto {
  @ApiPropertyOptional({ example: 30, description: '남은 PT 횟수 — 생략하면 횟수 관리 안 함' })
  @IsOptional()
  @IsInt({ message: 'PT 횟수는 숫자로 입력하세요' })
  @Min(0, { message: 'PT 횟수는 0~999 로 입력하세요' })
  @Max(999, { message: 'PT 횟수는 0~999 로 입력하세요' })
  ptRemaining?: number;
}

export class SetPtDto {
  @ApiProperty({ type: Number, nullable: true, example: 20, description: '지금부터 남은 PT 횟수. null = 횟수 관리 안 함' })
  @IsOptional()
  @IsInt({ message: 'PT 횟수는 숫자로 입력하세요' })
  @Min(0, { message: 'PT 횟수는 0~999 로 입력하세요' })
  @Max(999, { message: 'PT 횟수는 0~999 로 입력하세요' })
  remaining: number | null;
}

// 화면·URL 에는 내부 id 대신 code 를 노출
export class MemberDto {
  @ApiProperty({ example: 'K7Q2XA' }) code: string;
  @ApiProperty() name: string;
  @ApiProperty() memo: string;
  @ApiProperty({ type: Number, nullable: true, description: '남은 PT 횟수 (노쇼 차감 등으로 음수 가능). null = 횟수 관리 안 함' })
  ptRemaining: number | null;
}

export class UpdateMemberDto extends CreateMemberDto {}
