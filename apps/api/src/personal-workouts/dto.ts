import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, Length, MaxLength, ValidateNested } from 'class-validator';
import { COMMENT_AUTHORS, type CommentAuthor } from '../libs/database/entities/personal-workout-comment.entity.js';
import { ExerciseDto } from '../workouts/dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// 통째로 저장 (같은 날이면 덮어쓰기). 본문·종목 둘 다 비면 400 — 지우려면 DELETE
export class SavePersonalWorkoutDto {
  @ApiProperty({ example: '컨디션 좋아서 하체 위주로' })
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiProperty({ type: [ExerciseDto], description: '세트는 비어 있어도 됨' })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

export class SaveCommentDto {
  @ApiProperty({ example: '자세 좋네요!' })
  @Transform(trim)
  @IsString()
  @Length(1, 1000, { message: '댓글은 1~1000자로 입력해 주세요' })
  content: string;
}

export class PersonalWorkoutCommentDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: COMMENT_AUTHORS }) author: CommentAuthor;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: string;
}

export class PersonalWorkoutDto extends SavePersonalWorkoutDto {
  @ApiProperty({ example: '2026-10-30' }) date: string;
  @ApiProperty({ type: [PersonalWorkoutCommentDto], description: '오래된 순' }) comments: PersonalWorkoutCommentDto[];
  @ApiProperty({ description: '트레이너가 아직 안 본 기록 (새로 작성·수정·회원 댓글 이후 안 열어 봄)' }) unread: boolean;
}

export class UnreadCountDto {
  @ApiProperty({ example: 'K7Q2XA' }) memberCode: string;
  @ApiProperty({ example: 2 }) count: number;
}
