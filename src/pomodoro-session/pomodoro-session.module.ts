import { Module } from '@nestjs/common';
import { PomodoroSessionService } from './pomodoro-session.service';
import { PomodoroSessionController } from './pomodoro-session.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { StreakModule } from 'src/streak/streak.module';

@Module({
  imports: [PrismaModule, JwtModule, StreakModule],
  controllers: [PomodoroSessionController],
  providers: [PomodoroSessionService],
})
export class PomodoroSessionModule { }
