import { FailureLimiter } from './failure-limiter.js';

describe('FailureLimiter', () => {
  let t = 0;
  const limiter = () => new FailureLimiter(3, 60_000, 30_000, 10_000, () => t);
  beforeEach(() => (t = 0));

  it('기간 안에 limit 번 실패하면 잠기고, lockMs 뒤 풀림', () => {
    const l = limiter();
    expect(l.fail('a')).toBe(false);
    expect(l.fail('a')).toBe(false);
    expect(l.isLocked('a')).toBe(false);
    expect(l.fail('a')).toBe(true);
    expect(l.isLocked('a')).toBe(true);
    expect(l.isLocked('b')).toBe(false); // 다른 키는 영향 없음
    t += 30_001;
    expect(l.isLocked('a')).toBe(false);
  });

  it('기간이 지난 실패는 세지 않음', () => {
    const l = limiter();
    l.fail('a');
    l.fail('a');
    t += 60_001;
    expect(l.fail('a')).toBe(false);
    expect(l.isLocked('a')).toBe(false);
  });

  it('reset 하면 실패 횟수 초기화', () => {
    const l = limiter();
    l.fail('a');
    l.fail('a');
    l.reset('a');
    expect(l.fail('a')).toBe(false);
  });

  it('키 개수 상한 — 넘치면 오래된 키부터 정리, 잠긴 최근 키는 유지', () => {
    const l = new FailureLimiter(1, 60_000, 30_000, 3, () => t);
    l.fail('locked');
    for (const k of ['x', 'y', 'z', 'w']) l.fail(k);
    expect(l.isLocked('w')).toBe(true);
    expect(l.isLocked('locked')).toBe(false); // 가장 오래된 키가 밀려남
  });
});
