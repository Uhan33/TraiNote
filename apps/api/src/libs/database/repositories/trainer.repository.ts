import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../entities/trainer.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class TrainerRepository extends BaseRepository<Trainer> {
  constructor(@InjectRepository(Trainer) repository: Repository<Trainer>) {
    super(repository);
  }

  findById(id: string) {
    return this.findOneBy({ id });
  }

  findByLoginId(loginId: string) {
    return this.findOneBy({ loginId });
  }

  // 아이디 또는 (입력했다면) 이메일이 겹치는 트레이너
  findDuplicate(loginId: string, email?: string | null) {
    return this.findOneBy(email ? [{ loginId }, { email }] : { loginId });
  }

  add(data: Pick<Trainer, 'loginId' | 'email' | 'name' | 'passwordHash'>) {
    return this.insertOne(data);
  }
}
