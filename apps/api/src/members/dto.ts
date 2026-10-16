import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

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

// 화면·URL 에는 내부 id 대신 code 를 노출
export class MemberDto {
  @ApiProperty({ example: 'K7Q2XA' }) code: string;
  @ApiProperty() name: string;
  @ApiProperty() memo: string;
}

export class UpdateMemberDto extends CreateMemberDto {}
