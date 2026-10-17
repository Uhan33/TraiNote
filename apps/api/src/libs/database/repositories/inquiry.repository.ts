import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from '../entities/inquiry.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class InquiryRepository extends BaseRepository<Inquiry> {
  constructor(@InjectRepository(Inquiry) repository: Repository<Inquiry>) {
    super(repository);
  }

  // 최신순 — 문의 내역
  listByTrainer(trainerId: string) {
    return this.find({ where: { trainerId }, order: { createdAt: 'DESC' } });
  }

  // 운영자용: 전체 문의 최신순, 보낸 트레이너 함께
  listAllWithTrainer() {
    return this.find({ relations: { trainer: true }, order: { createdAt: 'DESC' } });
  }

  findByIdWithTrainer(id: string) {
    return this.findOne({ where: { id }, relations: { trainer: true } });
  }

  async saveAnswer(id: string, answer: string) {
    await this.update({ id }, { answer, answeredAt: new Date() });
  }

  add(data: Pick<Inquiry, 'trainerId' | 'category' | 'title' | 'content' | 'contact' | 'userAgent' | 'appVersion'>) {
    return this.insertOne(data);
  }
}
