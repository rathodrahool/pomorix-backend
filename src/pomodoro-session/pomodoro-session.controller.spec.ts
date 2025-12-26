import { Test, TestingModule } from '@nestjs/testing';
import { PomodoroSessionController } from './pomodoro-session.controller';
import { PomodoroSessionService } from './pomodoro-session.service';

describe('PomodoroSessionController', () => {
  let controller: PomodoroSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PomodoroSessionController],
      providers: [PomodoroSessionService],
    }).compile();

    controller = module.get<PomodoroSessionController>(PomodoroSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
