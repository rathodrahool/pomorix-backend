import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { envValidationSchema } from './config/env.validation';
import { TaskModule } from './task/task.module';
import { JwtModule } from './jwt/jwt.module';
import { AuthModule } from './auth/auth.module';
import { PomodoroSessionModule } from './pomodoro-session/pomodoro-session.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { StreakModule } from './streak/streak.module';
import { BadgeModule } from './badge/badge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allUnknown: true,
      },
    }), // load .env
    PrismaModule,
    TaskModule,
    JwtModule,
    AuthModule,
    PomodoroSessionModule,
    UserSettingsModule,
    StreakModule,
    BadgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
