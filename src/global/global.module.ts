import { Module } from '@nestjs/common';
import { GlobalService } from './global.service';
import { GlobalController } from './global.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GlobalController],
    providers: [GlobalService],
})
export class GlobalModule { }
