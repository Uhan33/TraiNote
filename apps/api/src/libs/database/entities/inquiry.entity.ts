import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Trainer } from './trainer.entity.js';

export const INQUIRY_CATEGORIES = ['usage', 'bug', 'feature', 'exercise', 'etc'] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

// 트레이너 문의. 운영자는 DB 에서 확인·답변 (README 문의 확인) — 트레이너는 내 정보 > 문의 내역에서 답변 확인
@Entity('inquiry')
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trainer_id', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  // usage 사용 방법 · bug 오류 신고 · feature 기능 제안 · exercise 종목 추가 요청 · etc 기타
  @Column({ type: 'varchar', length: 20 })
  category: InquiryCategory;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  // 답변 받을 연락처 (선택 — 이메일·전화 등 자유 입력)
  @Column({ type: 'varchar', length: 100, default: '' })
  contact: string;

  // 오류 재현용 — 보낸 기기 브라우저 정보·앱 버전
  @Column({ name: 'user_agent', type: 'varchar', length: 300, default: '' })
  userAgent: string;

  @Column({ name: 'app_version', type: 'varchar', length: 20, default: '' })
  appVersion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // 운영자 답변 (null = 답변 대기)
  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt: Date | null;
}
