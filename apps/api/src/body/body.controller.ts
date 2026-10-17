import { Body, Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { BodyService } from './body.service.js';
import { BodyRecordDto, SaveBodyRecordDto } from './dto.js';

@ApiTags('body')
@Controller('members/:code/body-records')
@UseGuards(AuthGuard)
export class BodyController {
  constructor(private readonly bodyService: BodyService) {}

  @Get()
  @ApiOkResponse({ type: [BodyRecordDto], description: '날짜 오름차순' })
  @ApiNotFoundResponse()
  list(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.bodyService.list(trainerId, code);
  }

  @Put(':date')
  @HttpCode(204)
  @ApiNoContentResponse({ description: '같은 날짜면 덮어쓰기' })
  @ApiNotFoundResponse()
  save(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string, @Body() dto: SaveBodyRecordDto) {
    return this.bodyService.save(trainerId, code, date, dto);
  }

  @Delete(':date')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string) {
    return this.bodyService.remove(trainerId, code, date);
  }
}
