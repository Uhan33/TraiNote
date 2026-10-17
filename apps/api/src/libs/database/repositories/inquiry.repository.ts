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

  add(data: Pick<Inquiry, 'trainerId' | 'category' | 'title' | 'content' | 'contact' | 'userAgent' | 'appVersion'>) {
    return this.insertOne(data);
  }
}
