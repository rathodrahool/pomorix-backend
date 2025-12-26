import { Controller, Post, Get, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { PomodoroSessionService } from './pomodoro-session.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { startPomodoroSchema } from './validation/pomodoro.validation';
import type { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('pomodoro-session')
export class PomodoroSessionController {
  constructor(private readonly pomodoroSessionService: PomodoroSessionService) { }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new JoiValidationPipe(startPomodoroSchema))
    startPomodoroDto: StartPomodoroDto,
  ) {
    const session = await this.pomodoroSessionService.start(user.id, startPomodoroDto);
    return ApiResponse.success(
      HttpStatus.CREATED,
      MESSAGE.SUCCESS.POMODORO.STARTED,
      session,
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrent(@CurrentUser() user: AuthenticatedUser) {
    const session = await this.pomodoroSessionService.getCurrent(user.id);

    if (!session) {
      return ApiResponse.success(
        HttpStatus.OK,
        MESSAGE.SUCCESS.POMODORO.NO_ACTIVE,
        { active: false },
      );
    }

    return ApiResponse.success(
      HttpStatus.OK,
      MESSAGE.SUCCESS.POMODORO.CURRENT,
      session,
    );
  }
}
