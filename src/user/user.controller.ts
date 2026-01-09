import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { getProfileQuerySchema } from './validation/profile.validation';
import type { GetProfileQueryDto } from './dto/analytics-range.dto';
import { AnalyticsRange } from './dto/analytics-range.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Query(new JoiValidationPipe(getProfileQuerySchema)) query: GetProfileQueryDto,
    ) {
        const range = query.range || AnalyticsRange.LAST_7_DAYS;
        const profile = await this.userService.getProfile(user.id, range);

        return ApiResponse.success(
            HttpStatus.OK,
            MESSAGE.SUCCESS.USER.PROFILE_RETRIEVED,
            profile,
        );
    }
}
