import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// Node 내장 scrypt (외부 의존성 없음). OWASP 권장 조합 N=2^15, r=8, p=3
// 저장 형식: scrypt$N$r$p$salt$hash — 파라미터를 함께 저장해 나중에 강도 올려도 기존 해시 검증 가능
const N = 2 ** 15;
const R = 8;
const P = 3;
const KEY_LEN = 64;

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEY_LEN, { ...options, maxmem: 128 * options.N! * options.r! * 2 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
