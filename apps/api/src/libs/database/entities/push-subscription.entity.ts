import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './member.entity.js';

// 회원 기기의 웹 푸시 구독 (홈 화면 앱에서 알림 허용) — 기기(endpoint)당 1개, 회원당 여러 기기 가능
// 코드 재발급·연결 해제 시 삭제 (예전 기기로 알림이 가지 않게)
@Entity('push_subscription')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  // 브라우저 푸시 서비스(Apple·Google 등) 주소 — 기기 식별
  @Column({ type: 'text', unique: true })
  endpoint: string;

  // 알림 내용 암호화 키 (브라우저가 발급)
  @Column({ type: 'varchar', length: 200 })
  p256dh: string;

  @Column({ type: 'varchar', length: 100 })
  auth: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
