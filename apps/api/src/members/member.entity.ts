import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Trainer } from '../trainers/trainer.entity.js';

// 회원은 가입하지 않음 — 이름만 저장(개인정보 최소화), 트레이너 1명에게만 연결
@Entity('member')
export class Member {
  // 내부 PK. 화면·URL 에는 code 를 노출
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 6자리 영대문자·숫자. 회원 식별자이자 초대코드 — 유출 시 이 값만 재발급
  @Column({ type: 'char', length: 6, unique: true })
  code: string;

  @Index()
  @Column({ name: 'trainer_id', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // null = 연결 중. 연결이 끊기면 코드 무효
  @Column({ name: 'disconnected_at', type: 'timestamptz', nullable: true })
  disconnectedAt: Date | null;
}
