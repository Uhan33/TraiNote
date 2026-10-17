import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const TRAINER_ROLES = ['trainer', 'admin'] as const;
export type TrainerRole = (typeof TRAINER_ROLES)[number];

@Entity('trainer')
@Check('CHK_trainer_role', `"role" IN ('trainer', 'admin')`)
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 로그인용 아이디
  @Column({ name: 'login_id', type: 'varchar', length: 30, unique: true })
  loginId: string;

  // 비밀번호 찾기용, 선택. 인증 없음(베타) — 정식 출시 전 인증 + "인증된 이메일만 unique" 로 전환
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  // 소셜 로그인 추가 시 비밀번호 없는 계정 허용을 위해 nullable
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  // 권한. admin = 운영자(문의 관리 등) — API 로는 바꿀 수 없고 DB 에서만 지정 (README 운영자 지정)
  @Column({ type: 'varchar', length: 20, default: 'trainer' })
  role: TrainerRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
