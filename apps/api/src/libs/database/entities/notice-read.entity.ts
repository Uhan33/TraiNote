import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, Column } from 'typeorm';
import { Member } from './member.entity.js';
import { Notice } from './notice.entity.js';
import { Trainer } from './trainer.entity.js';

// 공지 읽음 — 계정별 (트레이너 또는 회원 중 하나만 채움). 행이 없으면 안 읽음
@Entity('notice_read')
@Unique(['noticeId', 'trainerId'])
@Unique(['noticeId', 'memberId'])
export class NoticeRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notice_id', type: 'uuid' })
  noticeId: string;

  @ManyToOne(() => Notice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;

  @Column({ name: 'trainer_id', type: 'uuid', nullable: true })
  trainerId: string | null;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ name: 'member_id', type: 'uuid', nullable: true })
  memberId: string | null;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
