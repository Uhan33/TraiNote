import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Trainer } from './trainer.entity.js';

// 로그인 기기(브라우저·PWA)마다 1줄. 원문은 쿠키에만, DB 에는 SHA-256 해시
// ponytail: 만료·폐기된 행은 쌓이기만 함. 많아지면 주기적 삭제 배치 추가
@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trainer_id', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  // 로그아웃 시각. null = 사용 가능
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  // 미사용 — 토큰 교체 방식(v0.12.2 까지)에서 쓰던 컬럼. 지울 땐 마이그레이션 필요
  @Column({ name: 'replaced_by_id', type: 'uuid', nullable: true })
  replacedById: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
