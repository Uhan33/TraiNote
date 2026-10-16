import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from '../trainers/trainer.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { RefreshToken } from './refresh-token.entity.js';
import { TokensService } from './tokens.service.js';

// Global: 다른 모듈에서 AuthGuard 를 바로 쓸 수 있게
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Trainer, RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // tokens.service ACCESS_TTL_MS 와 동일
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService, AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
