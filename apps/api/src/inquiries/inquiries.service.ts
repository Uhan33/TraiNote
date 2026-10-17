import { Injectable } from '@nestjs/common';
import { InquiryRepository } from '../libs/database/repositories/inquiry.repository.js';
import type { Inquiry } from '../libs/database/entities/inquiry.entity.js';
import type { CreateInquiryDto, InquiryDto } from './dto.js';

// 기기 정보·연락처는 운영자용이라 응답에서 제외
const toDto = (i: Inquiry): InquiryDto => ({
  id: i.id,
  category: i.category,
  title: i.title,
  content: i.content,
  createdAt: i.createdAt.toISOString(),
  answer: i.answer,
  answeredAt: i.answeredAt?.toISOString() ?? null,
});

@Injectable()
export class InquiriesService {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async list(trainerId: string) {
    return (await this.inquiryRepository.listByTrainer(trainerId)).map(toDto);
  }

  async create(trainerId: string, dto: CreateInquiryDto, userAgent = '') {
    await this.inquiryRepository.add({
      trainerId,
      category: dto.category,
      title: dto.title,
      content: dto.content,
      contact: dto.contact ?? '',
      userAgent: userAgent.slice(0, 300),
      appVersion: dto.appVersion ?? '',
    });
  }
}
