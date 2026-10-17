import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(@InjectRepository(RefreshToken) repository: Repository<RefreshToken>) {
    super(repository);
  }

  findByHash(tokenHash: string) {
    return this.findOneBy({ tokenHash });
  }

  existsActive(id: string) {
    return this.existsBy({ id, revokedAt: IsNull() });
  }

  async add(data: Pick<RefreshToken, 'trainerId' | 'tokenHash' | 'expiresAt'>) {
    return (await this.insertOne(data)).id;
  }

  // 아직 살아 있을 때만 교체 처리 — 동시 요청 중 하나만 성공 (true = 이 요청이 교체함)
  async replaceIfActive(id: string, replacedById: string) {
    return (await this.update({ id, revokedAt: IsNull() }, { revokedAt: new Date(), replacedById })) > 0;
  }

  async revokeById(id: string) {
    await this.update({ id }, { revokedAt: new Date() });
  }

  async revokeByHash(tokenHash: string) {
    await this.update({ tokenHash, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async revokeAllOf(trainerId: string) {
    await this.update({ trainerId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
