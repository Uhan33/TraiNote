import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Member } from './member.entity.js';
import { PersonalWorkoutComment } from './personal-workout-comment.entity.js';
import type { WorkoutExercise } from './workout-log.entity.js';

// 회원이 직접 쓰는 개인운동 기록 — 회원·날짜당 1개. PT 일지(workout_log)와 별개라 PT 차감·성장 그래프에 안 들어감
@Entity('personal_workout')
@Unique(['memberId', 'logDate'])
export class PersonalWorkout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'log_date', type: 'date' })
  logDate: string;

  // 본문 (컨디션, 느낀 점 등)
  @Column({ type: 'text', default: '' })
  content: string;

  // 종목은 PT 일지와 같은 형태. 세트는 비어 있어도 됨
  @Column({ type: 'jsonb', default: () => "'[]'" })
  exercises: WorkoutExercise[];

  // 회원이 마지막으로 쓴 시각 (작성·수정·회원 댓글). trainerReadAt 보다 나중이면 트레이너 화면에 '안 읽음'
  @Column({ name: 'member_updated_at', type: 'timestamptz', default: () => 'now()' })
  memberUpdatedAt: Date;

  // 트레이너가 이 기록을 열어 본 시각. null = 아직 안 봄
  @Column({ name: 'trainer_read_at', type: 'timestamptz', nullable: true })
  trainerReadAt: Date | null;

  @OneToMany(() => PersonalWorkoutComment, (c) => c.personalWorkout)
  comments: PersonalWorkoutComment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
