import { HttpException, UnauthorizedException } from '@nestjs/common';
import type { TrainerRepository } from '../libs/database/repositories/trainer.repository.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';

describe('AuthService 로그인 실패 잠금', () => {
  it('같은 아이디로 10번 틀리면 맞는 비밀번호도 429, 다른 아이디는 영향 없음', async () => {
    const trainer = { id: 't1', loginId: 'coach', email: null, name: '코치', role: 'trainer', passwordHash: await hashPassword('right-password') };
    const repo = { findByLoginId: async (loginId: string) => (loginId === 'coach' ? trainer : null) } as unknown as TrainerRepository;
    const service = new AuthService(repo);

    for (let i = 0; i < 10; i++) {
      await expect(service.login({ loginId: 'coach', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.login({ loginId: 'coach', password: 'right-password' })).rejects.toMatchObject({ status: 429 });
    await expect(service.login({ loginId: 'other', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('성공하면 실패 횟수 초기화', async () => {
    const trainer = { id: 't1', loginId: 'coach', email: null, name: '코치', role: 'trainer', passwordHash: await hashPassword('right-password') };
    const repo = { findByLoginId: async () => trainer } as unknown as TrainerRepository;
    const service = new AuthService(repo);

    for (let i = 0; i < 9; i++) await service.login({ loginId: 'coach', password: 'wrong' }).catch((e: HttpException) => e);
    await expect(service.login({ loginId: 'coach', password: 'right-password' })).resolves.toMatchObject({ id: 't1' });
    await expect(service.login({ loginId: 'coach', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException); // 다시 1회부터
    await expect(service.login({ loginId: 'coach', password: 'right-password' })).resolves.toMatchObject({ id: 't1' });
  });
});
