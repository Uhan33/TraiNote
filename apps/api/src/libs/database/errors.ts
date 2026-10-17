import { QueryFailedError } from 'typeorm';

// Postgres unique 제약 위반 (23505)
export const isUniqueViolation = (e: unknown): e is QueryFailedError =>
  e instanceof QueryFailedError && (e.driverError as { code?: string }).code === '23505';
