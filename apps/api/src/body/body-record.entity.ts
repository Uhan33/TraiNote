import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Member } from '../members/member.entity.js';

// numeric 은 pg 드라이버가 문자열로 주므로 숫자로 변환
const numeric = { to: (v: number | null) => v, from: (v: string | null) => (v === null ? null : Number(v)) };

// 회원·날짜당 1개. 체중 필수, 체지방률·골격근량은 인바디 잰 날만 (선택)
@Entity('body_record')
@Unique(['memberId', 'recordDate'])
export class BodyRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'record_date', type: 'date' })
  recordDate: string;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 5, scale: 2, transformer: numeric })
  weightKg: number;

  @Column({ name: 'body_fat_pct', type: 'numeric', precision: 4, scale: 1, nullable: true, transformer: numeric })
  bodyFatPct: number | null;

  @Column({ name: 'skeletal_muscle_kg', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numeric })
  skeletalMuscleKg: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
