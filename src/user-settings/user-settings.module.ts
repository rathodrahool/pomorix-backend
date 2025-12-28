import { Module } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsController } from './user-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule { }
