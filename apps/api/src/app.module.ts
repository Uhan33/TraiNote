import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BodyModule } from './body/body.module.js';
import { InquiriesModule } from './inquiries/inquiries.module.js';
import { DatabaseModule } from './libs/database/database.module.js';
import { MemberViewModule } from './member-view/member-view.module.js';
import { MembersModule } from './members/members.module.js';
import { WorkoutsModule } from './workouts/workouts.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // 기본: IP 당 1분 300회. 인증 API 는 컨트롤러에서 더 낮게
    ThrottlerModule.forRoot([{ limit: 300, ttl: 60_000 }]),
    AuthModule,
    MembersModule,
    WorkoutsModule,
    MemberViewModule,
    BodyModule,
    InquiriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
