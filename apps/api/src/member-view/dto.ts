import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches, MaxLength } from 'class-validator';
import { WorkoutLogDto } from '../workouts/dto.js';

export class MemberSessionDto {
  @ApiProperty({ example: 'K7Q2XA' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{6}$/, { message: '회원 코드 6자리를 입력해 주세요' })
  code: string;
}

// 회원 본인에게 보이는 정보만. 트레이너 전용 회원 메모(member.memo)·코드는 포함하지 않음
export class MemberViewDto {
  @ApiProperty() name: string;
  @ApiProperty() trainerName: string;
  @ApiProperty({ description: 'month(YYYY-MM) 의 운동 횟수' }) monthCount: number;
  @ApiProperty() totalCount: number;
  @ApiProperty({ type: Number, nullable: true, description: '남은 PT 횟수. null = 트레이너가 횟수 관리 안 함' }) ptRemaining: number | null;
}

export class MemberViewWorkoutDto extends OmitType(WorkoutLogDto, ['memberCode', 'completedAt'] as const) {}

export class PushKeyDto {
  @ApiProperty({ description: 'VAPID 공개 키. 빈 문자열 = 서버에 알림 설정 없음' }) publicKey: string;
}

// 브라우저 PushSubscription.toJSON() 의 endpoint·keys
export class PushSubscriptionDto {
  // 서버가 이 주소로 요청을 보내므로 알려진 브라우저 푸시 서비스만 허용 (내부 주소 등으로 요청 유도 방지)
  @ApiProperty({ example: 'https://web.push.apple.com/...' })
  @MaxLength(1000)
  @Matches(/^https:\/\/([a-z0-9-]+\.)*(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)\//, {
    message: '지원하지 않는 알림 주소예요',
  })
  endpoint: string;

  @ApiProperty() @Matches(/^[A-Za-z0-9_=-]{1,200}$/) p256dh: string;
  @ApiProperty() @Matches(/^[A-Za-z0-9_=-]{1,100}$/) auth: string;
}
