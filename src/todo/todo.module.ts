import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule { }
