import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';

// 브라우저 PushSubscription.toJSON() 의 endpoint·keys — 회원·운영자 구독 공용
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

  // 방금 알림을 허용했으면 true — 이 기기로 "알림이 켜졌어요" 확인 알림 (실행마다 하는 재등록은 false)
  @ApiPropertyOptional() @IsOptional() @IsBoolean() welcome?: boolean;
}
