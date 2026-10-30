import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 공지사항 (내 정보 > 공지사항). 트레이너·회원에게 다른 글 — 한쪽만 보일 글은 다른 쪽 본문을 null 로
// 본문: 빈 줄로 문단 구분, '· ' 로 시작하는 줄은 목록. 지금은 운영자가 DB 로 추가 (관리 화면은 나중에)
@Entity('notice')
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'trainer_body', type: 'text', nullable: true })
  trainerBody: string | null;

  @Column({ name: 'member_body', type: 'text', nullable: true })
  memberBody: string | null;

  // 게시일 — 목록 순서·표시 날짜
  @Column({ name: 'posted_on', type: 'date' })
  postedOn: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
