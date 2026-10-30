import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PersonalWorkout } from './personal-workout.entity.js';

export const COMMENT_AUTHORS = ['member', 'trainer'] as const;
export type CommentAuthor = (typeof COMMENT_AUTHORS)[number];

// 개인운동 댓글 — 회원·담당 트레이너 둘만 쓰므로 작성자는 구분값만 저장
@Entity('personal_workout_comment')
export class PersonalWorkoutComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'personal_workout_id', type: 'uuid' })
  personalWorkoutId: string;

  @ManyToOne(() => PersonalWorkout, (w) => w.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personal_workout_id' })
  personalWorkout: PersonalWorkout;

  @Column({ type: 'varchar', length: 10 })
  author: CommentAuthor;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
