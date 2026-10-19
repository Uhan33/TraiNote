import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 운동 종목 기본 목록 (전체 트레이너 공통) — 재배포 없이 DB 에서 추가·수정 (README 종목 관리)
// 운동일지는 종목 이름을 텍스트로 저장하므로 여기서 바꾸거나 지워도 지난 일지는 그대로
@Entity('exercise')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  // 가슴·등·하체·어깨·팔·코어 — 화면의 부위 순서는 web 이 정함 (새 부위는 맨 뒤)
  @Column({ name: 'body_part', type: 'varchar', length: 20 })
  bodyPart: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
