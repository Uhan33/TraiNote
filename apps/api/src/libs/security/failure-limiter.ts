// 실패 횟수 제한 — windowMs 안에 limit 번 실패하면 lockMs 동안 잠금 (성공하면 reset)
// ponytail: 서버 메모리 저장 — 재시작(배포) 시 초기화, 서버가 여러 대면 공유 안 됨 → 그때 Redis 로
export class FailureLimiter {
  private readonly entries = new Map<string, { fails: number[]; lockedUntil: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly lockMs: number,
    // 무작위 키(아이디)를 대량으로 보내 메모리를 채우지 못하게 상한
    private readonly maxKeys = 10_000,
    private readonly now: () => number = Date.now,
  ) {}

  isLocked(key: string) {
    return (this.entries.get(key)?.lockedUntil ?? 0) > this.now();
  }

  // 실패 기록. 이번 실패로 잠기면 true (경고 로그용)
  fail(key: string) {
    const t = this.now();
    const entry = this.entries.get(key) ?? { fails: [], lockedUntil: 0 };
    entry.fails = entry.fails.filter((at) => at > t - this.windowMs);
    entry.fails.push(t);
    const locked = entry.fails.length >= this.limit;
    if (locked) {
      entry.lockedUntil = t + this.lockMs;
      entry.fails = [];
    }
    // 최근 사용 순서 유지 (오래된 키부터 정리)
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.evict(t);
    return locked;
  }

  reset(key: string) {
    this.entries.delete(key);
  }

  private evict(t: number) {
    if (this.entries.size <= this.maxKeys) return;
    for (const [key, e] of this.entries) {
      if (e.lockedUntil <= t && (e.fails.at(-1) ?? 0) <= t - this.windowMs) this.entries.delete(key);
    }
    for (const key of this.entries.keys()) {
      if (this.entries.size <= this.maxKeys) break;
      this.entries.delete(key);
    }
  }
}
