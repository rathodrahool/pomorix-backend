import { Module } from '@nestjs/common';
import { StreakService } from './streak.service';
import { StreakController } from './streak.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
    imports: [PrismaModule, JwtModule],
    controllers: [StreakController],
    providers: [StreakService],
    exports: [StreakService], // Export for event handling
})
export class StreakModule { }
