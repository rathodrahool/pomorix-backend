import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
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
      'Pomodoro session started successfully',
      session,
    );
  }
}
