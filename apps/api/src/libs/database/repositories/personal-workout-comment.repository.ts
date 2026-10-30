import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalWorkoutComment, type CommentAuthor } from '../entities/personal-workout-comment.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class PersonalWorkoutCommentRepository extends BaseRepository<PersonalWorkoutComment> {
  constructor(@InjectRepository(PersonalWorkoutComment) repository: Repository<PersonalWorkoutComment>) {
    super(repository);
  }

  add(personalWorkoutId: string, author: CommentAuthor, content: string) {
    return this.insertOne({ personalWorkoutId, author, content });
  }

  // 본인 댓글만. true = 삭제됨
  async removeOwn(id: string, personalWorkoutId: string, author: CommentAuthor) {
    return (await this.repository.delete({ id, personalWorkoutId, author })).affected === 1;
  }
}
