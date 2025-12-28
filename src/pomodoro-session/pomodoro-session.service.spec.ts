import { Test, TestingModule } from '@nestjs/testing';
import { PomodoroSessionService } from './pomodoro-session.service';

describe('PomodoroSessionService', () => {
  let service: PomodoroSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PomodoroSessionService],
    }).compile();

    service = module.get<PomodoroSessionService>(PomodoroSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
