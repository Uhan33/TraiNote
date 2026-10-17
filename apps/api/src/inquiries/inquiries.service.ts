import { Injectable } from '@nestjs/common';
import { InquiryRepository } from '../libs/database/repositories/inquiry.repository.js';
import type { CreateInquiryDto } from './dto.js';

@Injectable()
export class InquiriesService {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

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
