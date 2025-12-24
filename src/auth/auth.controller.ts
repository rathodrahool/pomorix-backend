import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { SignupDto } from './dto/signup.dto';
import { JoiValidationPipe } from '../common/joi-validation.pipe';
import { signupSchema } from './validation/auth.validation';
import { ApiResponse } from '../common/api-response';
import { MESSAGE } from '../common/response-messages';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  async signup(
    @Body(new JoiValidationPipe(signupSchema))
    signupDto: SignupDto,
  ) {
    const result = await this.authService.signup(signupDto);
    return ApiResponse.success(
      HttpStatus.CREATED,
      MESSAGE.SUCCESS.CREATE('User'),
      result,
    );
  }
}
