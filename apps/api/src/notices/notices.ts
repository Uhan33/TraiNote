import { ApiProperty } from '@nestjs/swagger';
import { NotFoundException } from '@nestjs/common';
import type { NoticeReader, NoticeRepository } from '../libs/database/repositories/notice.repository.js';

export class NoticeDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ example: '2026-10-30' }) date: string;
  @ApiProperty({ description: "빈 줄로 문단 구분, '· ' 로 시작하는 줄은 목록" }) body: string;
  @ApiProperty({ description: '이 계정이 열어 봤는지' }) read: boolean;
}

// 트레이너·회원 컨트롤러 공용
export const listNotices = async (repo: NoticeRepository, reader: NoticeReader): Promise<NoticeDto[]> => {
  const { notices, readIds } = await repo.listFor(reader);
  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    date: n.postedOn,
    body: (reader.audience === 'trainer' ? n.trainerBody : n.memberBody) ?? '',
    read: readIds.has(n.id),
  }));
};

export const markNoticeRead = async (repo: NoticeRepository, id: string, reader: NoticeReader) => {
  if (!(await repo.exists(id))) throw new NotFoundException('공지를 찾을 수 없습니다');
  await repo.markRead(id, reader);
};
