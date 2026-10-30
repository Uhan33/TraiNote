import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { NoticeRepository } from '../libs/database/repositories/notice.repository.js';
import { listNotices, markNoticeRead, NoticeDto } from './notices.js';

// 트레이너 공지사항. 회원은 /member/notices
@ApiTags('notices')
@Controller('notices')
@UseGuards(AuthGuard)
export class NoticesController {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  @Get()
  @ApiOkResponse({ type: [NoticeDto], description: '최신순' })
  list(@CurrentTrainerId() trainerId: string): Promise<NoticeDto[]> {
    return listNotices(this.noticeRepository, { audience: 'trainer', id: trainerId });
  }

  @Post(':id/read')
  @HttpCode(204)
  @ApiNoContentResponse({ description: '읽음 (이미 읽었으면 그대로)' })
  @ApiNotFoundResponse()
  markRead(@CurrentTrainerId() trainerId: string, @Param('id', ParseUUIDPipe) id: string) {
    return markNoticeRead(this.noticeRepository, id, { audience: 'trainer', id: trainerId });
  }
}
