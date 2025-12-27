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
import { TaskService } from './task.service';
import type { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { createTaskSchema, updateTaskSchema } from './validation/task.validation';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';
import type { FindAllTasksDto } from './dto/find-all-tasks.dto';
import { findAllTasksSchema } from './validation/find-all-tasks.validation';
import { UuidValidationPipe } from 'src/common/uuid-validation.pipe';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new JoiValidationPipe(createTaskSchema))
    createTaskDto: CreateTaskDto,
  ) {
    const result = await this.taskService.create(user.id, createTaskDto);
    return ApiResponse.success(HttpStatus.CREATED, MESSAGE.SUCCESS.CREATE('Task'), result);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new JoiValidationPipe(findAllTasksSchema))
    query: FindAllTasksDto,
  ) {
    const result = await this.taskService.findAll(user.id, query);
    return ApiResponse.successPaginated(
      HttpStatus.OK,
      MESSAGE.SUCCESS.RETRIEVE('Tasks'),
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
    const task = await this.taskService.findOne(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.RETRIEVE('Task'), task);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
    @Body(new JoiValidationPipe(updateTaskSchema))
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.taskService.update(user.id, id, updateTaskDto);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  async toggleActive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.taskService.toggleActive(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.taskService.remove(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.DELETE('Task'));
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    await this.taskService.restore(user.id, id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }
}
