import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../entities/exercise.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor(@InjectRepository(Exercise) repository: Repository<Exercise>) {
    super(repository);
  }

  listAll() {
    return this.find({ select: { name: true, bodyPart: true } });
  }
}
