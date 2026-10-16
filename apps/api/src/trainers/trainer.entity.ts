import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('trainer')
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 로그인용 아이디
  @Column({ name: 'login_id', type: 'varchar', length: 30, unique: true })
  loginId: string;

  // 비밀번호 찾기용
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // 소셜 로그인 추가 시 비밀번호 없는 계정 허용을 위해 nullable
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
