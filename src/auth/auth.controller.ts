import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from '../common/joi-validation.pipe';
import { signinSchema } from './validation/auth.validation';
import { ApiResponse } from '../common/api-response';
import { MESSAGE } from '../common/response-messages';
import type { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  async signin(
    @Body(new JoiValidationPipe(signinSchema))
    signinDto: SigninDto,
  ) {
    const result = await this.authService.signin(signinDto);
    return ApiResponse.success(
      HttpStatus.OK,
      MESSAGE.SUCCESS.AUTH.SIGNIN,
      result,
    );
  }
}
