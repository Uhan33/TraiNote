import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Member } from '../members/member.entity.js';

// 회원·날짜당 체중 1개. 인바디 연동 등으로 항목이 늘면 컬럼 추가
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

  // numeric 은 pg 드라이버가 문자열로 주므로 숫자로 변환
  @Column({
    name: 'weight_kg',
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string | null) => (v === null ? null : Number(v)) },
  })
  weightKg: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
