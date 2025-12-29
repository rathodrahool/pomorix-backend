import { SessionType } from '@prisma/client';

export class StartPomodoroDto {
    session_type: SessionType;
}
