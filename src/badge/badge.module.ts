import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { StreakModule } from 'src/streak/streak.module';

@Module({
    imports: [PrismaModule, JwtModule, StreakModule],
    controllers: [BadgeController],
    providers: [BadgeService],
    exports: [BadgeService], // Export for event handling
})
export class BadgeModule { }
