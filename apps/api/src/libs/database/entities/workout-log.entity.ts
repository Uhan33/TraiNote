import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Member } from './member.entity.js';

export type WorkoutSet = { kg: number | null; reps: number | null; done: boolean };
export type WorkoutExercise = { name: string; sets: WorkoutSet[] };

// 회원·날짜당 일지 1개. 운동·세트는 항상 통째로 읽고 쓰므로 jsonb 한 칸에 저장
// ponytail: 종목별 통계가 느려지면 workout_exercise / workout_set 테이블로 분리
@Entity('workout_log')
@Unique(['memberId', 'logDate'])
export class WorkoutLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  // YYYY-MM-DD (시간대 영향 없도록 date 타입, 문자열로 다룸)
  @Column({ name: 'log_date', type: 'date' })
  logDate: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  memo: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  exercises: WorkoutExercise[];

  // 트레이너가 "작성 완료"를 누른 시각 (null = 작성 중). 회원에게는 완료된 일지만 보이고, 처음 완료할 때 회원에게 푸시 알림
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
