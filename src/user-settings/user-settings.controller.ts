import { Controller, Get, Patch, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { updateUserSettingsSchema } from './validation/user-settings.validation';
import type { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) { }

  /**
   * GET /user-settings
   * Get current user settings (auto-creates with defaults if doesn't exist)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getSettings(@CurrentUser() user: AuthenticatedUser) {
    const settings = await this.userSettingsService.getSettings(user.id);
    return ApiResponse.success(
      HttpStatus.OK,
      MESSAGE.SUCCESS.USER_SETTINGS.RETRIEVED,
      settings,
    );
  }

  /**
   * PATCH /user-settings
   * Update user settings (partial update)
   */
  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new JoiValidationPipe(updateUserSettingsSchema))
    updateUserSettingsDto: UpdateUserSettingsDto,
  ) {
    const updated = await this.userSettingsService.updateSettings(
      user.id,
      updateUserSettingsDto,
    );
    return ApiResponse.success(
      HttpStatus.OK,
      MESSAGE.SUCCESS.USER_SETTINGS.UPDATED,
      updated,
    );
  }

  /**
   * POST /user-settings/reset
   * Reset settings to defaults
   */
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetSettings(@CurrentUser() user: AuthenticatedUser) {
    const resetSettings = await this.userSettingsService.resetSettings(user.id);
    return ApiResponse.success(
      HttpStatus.OK,
      MESSAGE.SUCCESS.USER_SETTINGS.RESET,
      resetSettings,
    );
  }
}
