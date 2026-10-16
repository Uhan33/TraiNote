import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { CreateMemberDto, MemberDto, UpdateMemberDto } from './dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@Controller('members')
@UseGuards(AuthGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @ApiOkResponse({ type: [MemberDto] })
  list(@CurrentTrainerId() trainerId: string) {
    return this.members.list(trainerId);
  }

  @Post()
  @ApiCreatedResponse({ type: MemberDto })
  create(@CurrentTrainerId() trainerId: string, @Body() dto: CreateMemberDto) {
    return this.members.create(trainerId, dto);
  }

  @Patch(':code')
  @ApiOkResponse({ type: MemberDto })
  @ApiNotFoundResponse()
  update(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(trainerId, code, dto);
  }

  @Post(':code/reissue')
  @ApiCreatedResponse({ type: MemberDto, description: '새 코드 발급 — 기존 코드로 접속한 회원 기기는 로그아웃' })
  @ApiNotFoundResponse()
  reissue(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.members.reissueCode(trainerId, code);
  }

  // 연결 해제(소프트 삭제)
  @Delete(':code')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.members.disconnect(trainerId, code);
  }
}
