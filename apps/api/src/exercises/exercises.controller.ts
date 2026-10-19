import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { ExerciseRepository } from '../libs/database/repositories/exercise.repository.js';

export class ExerciseCatalogDto {
  @ApiProperty({ example: '벤치프레스' }) name: string;
  @ApiProperty({ example: '가슴' }) bodyPart: string;
}

@ApiTags('exercises')
@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(private readonly exerciseRepository: ExerciseRepository) {}

  // 운동 추가 창의 기본 종목 목록 (정렬·부위별 묶기는 web)
  @Get()
  @ApiOkResponse({ type: [ExerciseCatalogDto] })
  list(): Promise<ExerciseCatalogDto[]> {
    return this.exerciseRepository.listAll();
  }
}
