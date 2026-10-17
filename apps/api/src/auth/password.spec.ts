import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('맞는 비밀번호만 통과하고 같은 비밀번호도 매번 다른 해시', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse', hash)).toBe(true);
    expect(await verifyPassword('wrong horse', hash)).toBe(false);
    expect(await hashPassword('correct horse')).not.toBe(hash);
  });

  it('형식이 깨진 저장값은 false', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});
