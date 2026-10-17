import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { INQUIRY_CATEGORIES, type InquiryCategory } from '../libs/database/entities/inquiry.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class InquiryDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: INQUIRY_CATEGORIES }) category: InquiryCategory;
  @ApiProperty() title: string;
  @ApiProperty() content: string;
  @ApiProperty({ example: '2026-10-17T03:35:50.325Z' }) createdAt: string;
  @ApiProperty({ type: String, nullable: true, description: '운영자 답변. null = 답변 대기' }) answer: string | null;
  @ApiProperty({ type: String, nullable: true }) answeredAt: string | null;
}

export class CreateInquiryDto {
  @ApiProperty({ enum: INQUIRY_CATEGORIES, description: 'usage 사용 방법 · bug 오류 신고 · feature 기능 제안 · etc 기타' })
  @IsIn(INQUIRY_CATEGORIES, { message: '문의 유형을 선택하세요' })
  category: InquiryCategory;

  @ApiProperty({ example: '회원 추가가 안 돼요' })
  @Transform(trim)
  @IsString()
  @Length(1, 100, { message: '제목은 1~100자로 입력하세요' })
  title: string;

  @ApiProperty({ example: '회원 추가 버튼을 누르면 …' })
  @Transform(trim)
  @IsString()
  @Length(1, 2000, { message: '내용은 1~2000자로 입력하세요' })
  content: string;

  @ApiPropertyOptional({ example: 'trainer@example.com', description: '답변 받을 연락처' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '연락처는 100자 이내로 입력하세요' })
  contact?: string;

  @ApiPropertyOptional({ example: '0.1.0' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;
}
