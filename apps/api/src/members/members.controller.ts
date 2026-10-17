import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { CreateMemberWithPtDto, MemberDto, SetPtDto, UpdateMemberDto } from './dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@Controller('members')
@UseGuards(AuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOkResponse({ type: [MemberDto] })
  list(@CurrentTrainerId() trainerId: string) {
    return this.membersService.list(trainerId);
  }

  @Post()
  @ApiCreatedResponse({ type: MemberDto })
  create(@CurrentTrainerId() trainerId: string, @Body() dto: CreateMemberWithPtDto) {
    return this.membersService.create(trainerId, dto);
  }

  @Patch(':code')
  @ApiOkResponse({ type: MemberDto })
  @ApiNotFoundResponse()
  update(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(trainerId, code, dto);
  }

  @Put(':code/pt')
  @ApiOkResponse({ type: MemberDto, description: '지금부터 남은 PT 횟수 지정 — 이후 작성되는 운동일지마다 1회 차감' })
  @ApiNotFoundResponse()
  setPt(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Body() dto: SetPtDto) {
    return this.membersService.setPt(trainerId, code, dto.remaining ?? null);
  }

  @Post(':code/reissue')
  @ApiCreatedResponse({ type: MemberDto, description: '새 코드 발급 — 기존 코드로 접속한 회원 기기는 로그아웃' })
  @ApiNotFoundResponse()
  reissue(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.membersService.reissueCode(trainerId, code);
  }

  // 연결 해제(소프트 삭제)
  @Delete(':code')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.membersService.disconnect(trainerId, code);
  }
}
