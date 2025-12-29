import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { StreakService } from './streak.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('streak')
export class StreakController {
    constructor(private readonly streakService: StreakService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getStreak(@CurrentUser() user: AuthenticatedUser) {
        const streak = await this.streakService.getStreak(user.id);
        return ApiResponse.success(
            HttpStatus.OK,
            MESSAGE.SUCCESS.STREAK.RETRIEVED,
            streak,
        );
    }
}
