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
} from '@nestjs/common';
import { TaskService } from './task.service';
import type { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { createTaskSchema, updateTaskSchema } from './validation/task.validation';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';
import { FindAllTasksDto } from './dto/find-all-tasks.dto';
import { findAllTasksSchema } from './validation/find-all-tasks.validation';
import { UuidValidationPipe } from 'src/common/uuid-validation.pipe';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post()
  async create(
    @Body(new JoiValidationPipe(createTaskSchema))
    createTaskDto: CreateTaskDto,
  ) {
    await this.taskService.create(createTaskDto);
    return ApiResponse.success(HttpStatus.CREATED, MESSAGE.SUCCESS.CREATE('Task'));
  }

  @Get()
  async findAll(
    @Query(new JoiValidationPipe(findAllTasksSchema))
    query: FindAllTasksDto,
  ) {
    const result = await this.taskService.findAll(query);
    return ApiResponse.successPaginated(
      HttpStatus.OK,
      MESSAGE.SUCCESS.RETRIEVE('Tasks'),
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id', UuidValidationPipe) id: string) {
    const task = await this.taskService.findOne(id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.RETRIEVE('Task'), task);
  }

  @Patch(':id')
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body(new JoiValidationPipe(updateTaskSchema))
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.taskService.update(id, updateTaskDto);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id', UuidValidationPipe) id: string) {
    await this.taskService.toggleActive(id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }

  @Delete(':id')
  async remove(@Param('id', UuidValidationPipe) id: string) {
    await this.taskService.remove(id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.DELETE('Task'));
  }

  @Patch(':id/restore')
  async restore(@Param('id', UuidValidationPipe) id: string) {
    await this.taskService.restore(id);
    return ApiResponse.success(HttpStatus.OK, MESSAGE.SUCCESS.UPDATE('Task'));
  }
}
