import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import type { CreateTodoDto, UpdateTodoDto } from './dto/create-todo.dto';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { createTodoSchema, updateTodoSchema } from './validation/todo.validation';
import { ApiResponse } from '../../common/helpers/api-response';
import { MESSAGE } from '../../common/constants/response-messages';
import type { FindAllTodosDto } from './dto/find-all-todos.dto';
import { findAllTodosSchema } from './validation/find-all-todos.validation';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new JoiValidationPipe(createTodoSchema))
    createTodoDto: CreateTodoDto,
  ) {
    const result = await this.todoService.create(user.id, createTodoDto);
    return ApiResponse.success(HttpStatus.CREATED, MESSAGE.SUCCESS.CREATE('Todo'), result);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new JoiValidationPipe(findAllTodosSchema))
    query: FindAllTodosDto,
  ) {
    const result = await this.todoService.findAll(user.id, query);
    return ApiResponse.successPaginated(
      HttpStatus.OK,
      MESSAGE.SUCCESS.RETRIEVE('Todos'),
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    const todo = await this.todoService.findOne(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.RETRIEVE('Todo'), todo);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
    @Body(new JoiValidationPipe(updateTodoSchema))
    updateTodoDto: UpdateTodoDto,
  ) {
    await this.todoService.update(user.id, id, updateTodoDto);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Todo'));
  }

  @Patch(':id/toggle-completed')
  @UseGuards(JwtAuthGuard)
  async toggleCompleted(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.todoService.toggleCompleted(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Todo'));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.todoService.remove(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.DELETE('Todo'));
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.todoService.restore(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Todo'));
  }
}
