import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { ExerciseRepository } from '../libs/database/repositories/exercise.repository.js';
import { WorkoutLogRepository } from '../libs/database/repositories/workout-log.repository.js';

export class ExerciseCatalogDto {
  @ApiProperty({ example: '벤치프레스' }) name: string;
  @ApiProperty({ example: '가슴' }) bodyPart: string;
}

@ApiTags('exercises')
@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly workoutLogRepository: WorkoutLogRepository,
  ) {}

  // 운동 추가 창의 기본 종목 목록 (정렬·부위별 묶기는 web)
  @Get()
  @ApiOkResponse({ type: [ExerciseCatalogDto] })
  list(): Promise<ExerciseCatalogDto[]> {
    return this.exerciseRepository.listAll();
  }

  // 내가 일지에 직접 입력했던 종목 (기본 종목에 없는 것, 최근 쓴 순)
  @Get('custom')
  @ApiOkResponse({ type: [String] })
  listCustom(@CurrentTrainerId() trainerId: string): Promise<string[]> {
    return this.workoutLogRepository.listCustomExerciseNames(trainerId);
  }
}
