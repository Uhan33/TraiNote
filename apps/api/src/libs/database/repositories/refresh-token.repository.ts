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

  async add(data: Pick<RefreshToken, 'trainerId' | 'tokenHash' | 'expiresAt'>) {
    await this.insertOne(data);
  }

  async extend(id: string, expiresAt: Date) {
    await this.update({ id }, { expiresAt });
  }

  async revokeByHash(tokenHash: string) {
    await this.update({ tokenHash, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async revokeAllOf(trainerId: string) {
    await this.update({ trainerId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
