import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { NoticeRead } from '../entities/notice-read.entity.js';
import { Notice } from '../entities/notice.entity.js';
import { BaseRepository } from './base.repository.js';

export type NoticeReader = { audience: 'trainer'; id: string } | { audience: 'member'; id: string };

const readerColumn = (r: NoticeReader) => (r.audience === 'trainer' ? { trainerId: r.id } : { memberId: r.id });

@Injectable()
export class NoticeRepository extends BaseRepository<Notice> {
  constructor(
    @InjectRepository(Notice) repository: Repository<Notice>,
    @InjectRepository(NoticeRead) private readonly reads: Repository<NoticeRead>,
  ) {
    super(repository);
  }

  // 이 대상에게 보일 공지 (최신순) + 이 계정이 읽은 공지 id
  async listFor(reader: NoticeReader) {
    const [notices, reads] = await Promise.all([
      this.find({
        where: reader.audience === 'trainer' ? { trainerBody: Not(IsNull()) } : { memberBody: Not(IsNull()) },
        order: { postedOn: 'DESC', createdAt: 'DESC' },
      }),
      this.reads.find({ where: readerColumn(reader), select: { noticeId: true } }),
    ]);
    return { notices, readIds: new Set(reads.map((r) => r.noticeId)) };
  }

  exists(id: string) {
    return this.existsBy({ id });
  }

  // 이미 읽었으면 그대로
  async markRead(noticeId: string, reader: NoticeReader) {
    await this.reads.createQueryBuilder().insert().values({ noticeId, ...readerColumn(reader) }).orIgnore().execute();
  }
}
