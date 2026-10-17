import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryRepository } from '../libs/database/repositories/inquiry.repository.js';
import type { Inquiry } from '../libs/database/entities/inquiry.entity.js';
import type { AdminInquiryDto, CreateInquiryDto, InquiryDto } from './dto.js';

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

const toAdminDto = (i: Inquiry): AdminInquiryDto =>
  Object.assign(toDto(i), {
    trainerLoginId: i.trainer.loginId,
    trainerName: i.trainer.name,
    contact: i.contact,
    userAgent: i.userAgent,
    appVersion: i.appVersion,
  });

@Injectable()
export class InquiriesService {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async list(trainerId: string) {
    return (await this.inquiryRepository.listByTrainer(trainerId)).map(toDto);
  }

  // 운영자: 전체 문의
  async listAll() {
    return (await this.inquiryRepository.listAllWithTrainer()).map(toAdminDto);
  }

  // 운영자: 답변 등록·수정 — 트레이너의 문의 내역에 바로 표시
  async answer(id: string, answer: string) {
    if (!(await this.inquiryRepository.findByIdWithTrainer(id))) throw new NotFoundException('문의를 찾을 수 없습니다');
    await this.inquiryRepository.saveAnswer(id, answer);
    return toAdminDto((await this.inquiryRepository.findByIdWithTrainer(id))!);
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
