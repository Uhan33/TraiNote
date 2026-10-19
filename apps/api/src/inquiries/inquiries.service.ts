import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryRepository } from '../libs/database/repositories/inquiry.repository.js';
import { PushService } from '../push/push.service.js';
import type { Inquiry, InquiryCategory } from '../libs/database/entities/inquiry.entity.js';
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

const CATEGORY_LABEL: Record<InquiryCategory, string> = { usage: '사용 방법', bug: '오류 신고', feature: '기능 제안', etc: '기타' };

@Injectable()
export class InquiriesService {
  constructor(
    private readonly inquiryRepository: InquiryRepository,
    private readonly pushService: PushService,
  ) {}

  async list(trainerId: string) {
    return (await this.inquiryRepository.listByTrainer(trainerId)).map(toDto);
  }

  // 운영자: 전체 문의
  async listAll() {
    return (await this.inquiryRepository.listAllWithTrainer()).map(toAdminDto);
  }

  // 운영자: 답변 등록·수정 — 트레이너의 문의 내역에 바로 표시. 첫 답변이면 트레이너 기기로 알림 (수정은 알림 없음)
  async answer(id: string, answer: string) {
    const before = await this.inquiryRepository.findByIdWithTrainer(id);
    if (!before) throw new NotFoundException('문의를 찾을 수 없습니다');
    await this.inquiryRepository.saveAnswer(id, answer);
    if (before.answer === null) {
      await this.pushService.sendToTrainer(before.trainerId, { title: '문의에 답변이 왔어요', body: before.title, url: '/settings/inquiries' });
    }
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
    // 운영자 기기로 새 문의 알림
    await this.pushService.sendToAdmins({
      title: '새 문의가 등록됐어요',
      body: `[${CATEGORY_LABEL[dto.category]}] ${dto.title}`,
      url: '/settings/admin/inquiries',
    });
  }
}
