import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class SignupDto {
  @ApiProperty({ example: 'trainer01', description: '영소문자·숫자·_ 4~20자 (대문자 입력 시 소문자로 저장)' })
  @Transform(lower)
  @Matches(/^[a-z0-9_]{4,20}$/, { message: '아이디는 영문·숫자·_ 4~20자로 입력하세요' })
  loginId: string;

  @ApiPropertyOptional({ example: 'trainer@example.com', description: '선택 — 비밀번호 찾기용' })
  // 빈 문자열은 미입력으로 처리
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() || undefined : value))
  @IsOptional()
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'password1234', description: '8~72자' })
  @IsString()
  @Length(8, 72, { message: '비밀번호는 8~72자로 입력하세요' })
  password: string;

  @ApiProperty({ example: '홍길동' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 50, { message: '이름은 1~50자로 입력하세요' })
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'trainer01' })
  @Transform(lower)
  @IsString()
  @MaxLength(20)
  loginId: string;

  @ApiProperty({ example: 'password1234' })
  @IsString()
  @MaxLength(72)
  password: string;
}

export class TrainerDto {
  @ApiProperty() id: string;
  @ApiProperty() loginId: string;
  @ApiProperty({ type: String, nullable: true }) email: string | null;
  @ApiProperty() name: string;
}
