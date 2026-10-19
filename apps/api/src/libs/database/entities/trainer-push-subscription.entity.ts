import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Trainer } from './trainer.entity.js';

// 트레이너 기기의 웹 푸시 구독 — 지금은 운영자 새 문의 알림용 (발송 시 role = admin 만)
// 회원 구독(push_subscription)과 따로 — 한 기기에 트레이너·회원 앱이 함께 있어도 서로 덮어쓰지 않게
@Entity('trainer_push_subscription')
export class TrainerPushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trainer_id', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ type: 'text', unique: true })
  endpoint: string;

  @Column({ type: 'varchar', length: 200 })
  p256dh: string;

  @Column({ type: 'varchar', length: 100 })
  auth: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
