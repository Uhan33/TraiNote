import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Member } from '../libs/database/entities/member.entity.js';
import type { CommentAuthor, PersonalWorkoutComment } from '../libs/database/entities/personal-workout-comment.entity.js';
import type { PersonalWorkout } from '../libs/database/entities/personal-workout.entity.js';
import { PersonalWorkoutCommentRepository } from '../libs/database/repositories/personal-workout-comment.repository.js';
import { PersonalWorkoutRepository } from '../libs/database/repositories/personal-workout.repository.js';
import { PushService } from '../push/push.service.js';
import { assertDate } from '../workouts/workouts.service.js';
import type { PersonalWorkoutCommentDto, PersonalWorkoutDto, SaveCommentDto, SavePersonalWorkoutDto } from './dto.js';

export const PAGE_SIZE = 10;

const toCommentDto = (c: PersonalWorkoutComment): PersonalWorkoutCommentDto => ({
  id: c.id,
  author: c.author,
  content: c.content,
  createdAt: c.createdAt.toISOString(),
});

const toDto = (w: PersonalWorkout): PersonalWorkoutDto => ({
  date: w.logDate,
  content: w.content,
  exercises: w.exercises,
  comments: w.comments.map(toCommentDto),
  unread: !w.trainerReadAt || w.memberUpdatedAt > w.trainerReadAt,
});

const preview = (text: string) => (text.length > 60 ? `${text.slice(0, 60)}…` : text);

// 회원 개인운동 + 회원·트레이너 댓글. 회원 확인(코드·토큰)은 컨트롤러에서 — 여기는 Member 를 받음
@Injectable()
export class PersonalWorkoutsService {
  constructor(
    private readonly personalWorkoutRepository: PersonalWorkoutRepository,
    private readonly commentRepository: PersonalWorkoutCommentRepository,
    private readonly pushService: PushService,
  ) {}

  async list(member: Member, before?: string): Promise<PersonalWorkoutDto[]> {
    const rows = await this.personalWorkoutRepository.listRecent(member.id, PAGE_SIZE, before && assertDate(before));
    return rows.map(toDto);
  }

  // 회원이 작성. 처음 쓴 날만 트레이너에게 알림 (수정할 때마다 울리지 않게)
  async save(member: Member, date: string, { content, exercises }: SavePersonalWorkoutDto) {
    if (!content && exercises.length === 0) throw new BadRequestException('운동 종목이나 내용을 입력해 주세요');
    const created = await this.personalWorkoutRepository.saveByDate(member.id, assertDate(date), { content, exercises });
    if (created) {
      const [, m, d] = date.split('-').map(Number);
      await this.pushService.sendToTrainer(member.trainerId, {
        title: `${member.name}님이 개인운동을 기록했어요`,
        body: `${m}월 ${d}일 · ${preview(content || exercises.map((e) => e.name).join(', '))}`,
        url: `/personal/${member.code}`,
      });
    }
  }

  async remove(member: Member, date: string) {
    await this.personalWorkoutRepository.deleteByDate(member.id, assertDate(date));
  }

  // 댓글 — 상대에게 알림
  async addComment(member: Member, date: string, author: CommentAuthor, { content }: SaveCommentDto) {
    const workout = await this.personalWorkoutRepository.findByDate(member.id, assertDate(date));
    if (!workout) throw new NotFoundException('개인운동 기록이 없습니다');
    const comment = await this.commentRepository.add(workout.id, author, content);
    if (author === 'member') {
      await this.personalWorkoutRepository.touchByMember(workout.id);
      await this.pushService.sendToTrainer(member.trainerId, {
        title: `${member.name}님이 댓글을 남겼어요`,
        body: preview(content),
        url: `/personal/${member.code}`,
      });
    } else {
      await this.pushService.sendToMember(member.id, { title: '트레이너가 댓글을 남겼어요', body: preview(content), url: '/member/personal' });
    }
    return toCommentDto(comment);
  }

  // 트레이너가 기록을 열어 봄 — '안 읽음' 해제
  async markRead(member: Member, date: string) {
    await this.personalWorkoutRepository.markReadByTrainer(member.id, assertDate(date));
  }

  async unreadCounts(trainerId: string) {
    return (await this.personalWorkoutRepository.countUnreadByTrainer(trainerId)).map(({ code, count }) => ({ memberCode: code, count }));
  }

  // 본인이 쓴 댓글만 삭제
  async removeComment(member: Member, date: string, id: string, author: CommentAuthor) {
    const workout = await this.personalWorkoutRepository.findByDate(member.id, assertDate(date));
    if (!workout || !(await this.commentRepository.removeOwn(id, workout.id, author))) throw new NotFoundException('댓글을 찾을 수 없습니다');
  }
}
