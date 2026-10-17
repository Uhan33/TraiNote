import type {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  QueryDeepPartialEntity,
  Repository,
  UpsertOptions,
} from 'typeorm';

type Where<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

// 엔티티별 Repository 공통 — 조회 조건은 FindOptions 타입으로 검사(필드명·값 타입 오타는 컴파일 에러)
// 공통 메서드는 protected: 서비스에는 소프트 삭제 등 규칙이 들어간 도메인 메서드만 공개
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  // 이미 불러온 엔티티 저장은 규칙을 우회하지 않으므로 공개
  save(entity: T) {
    return this.repository.save(entity);
  }

  protected findOneBy(where: Where<T>) {
    return this.repository.findOneBy(where);
  }

  protected findOne(options: FindOneOptions<T>) {
    return this.repository.findOne(options);
  }

  protected find(options: FindManyOptions<T>) {
    return this.repository.find(options);
  }

  protected existsBy(where: Where<T>) {
    return this.repository.existsBy(where);
  }

  protected countBy(where: Where<T>) {
    return this.repository.countBy(where);
  }

  protected insertOne(data: DeepPartial<T>) {
    return this.repository.save(this.repository.create(data));
  }

  // 반영된 행 수
  protected async update(where: FindOptionsWhere<T>, data: QueryDeepPartialEntity<T>) {
    return (await this.repository.update(where, data)).affected ?? 0;
  }

  protected async upsert(data: QueryDeepPartialEntity<T>, options: UpsertOptions<T> | string[]) {
    await this.repository.upsert(data, options);
  }

  protected async delete(where: FindOptionsWhere<T>) {
    await this.repository.delete(where);
  }
}
