import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('badge')
export class BadgeController {
    constructor(private readonly badgeService: BadgeService) { }

    @Get('definitions')
    @UseGuards(JwtAuthGuard)
    async getAllDefinitions(@CurrentUser() user: AuthenticatedUser) {
        const badges = await this.badgeService.getAllBadgeDefinitions(user.id);
        return ApiResponse.success(
            HttpStatus.OK,
            MESSAGE.SUCCESS.BADGE.ALL_DEFINITIONS,
            badges,
        );
    }

    @Get('my-badges')
    @UseGuards(JwtAuthGuard)
    async getMyBadges(@CurrentUser() user: AuthenticatedUser) {
        const badges = await this.badgeService.getUserBadges(user.id);
        return ApiResponse.success(
            HttpStatus.OK,
            MESSAGE.SUCCESS.BADGE.RETRIEVED,
            badges,
        );
    }
}
