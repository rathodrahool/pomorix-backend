import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MESSAGE } from '../../common/response-messages';
import { omit, omitFromArray } from '../../common/utils/omit.util';
import { FindAllTodosDto } from './dto/find-all-todos.dto';

@Injectable()
export class TodoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateTodoDto) {
        const result = await this.prisma.todos.create({
            data: {
                user_id: userId,
                title: dto.title,
                description: dto.description,
                priority: dto.priority ?? 'MEDIUM',
            },
        });
        return { id: result.id };
    }

    async findAll(userId: string, query: FindAllTodosDto) {
        const { page, page_size, sort_by, sort_order, search, is_completed, priority } = query;

        const where: Prisma.todosWhereInput = {};

        // Always exclude soft-deleted todos
        where.deleted_at = null;

        // Filter by authenticated user
        where.user_id = userId;

        // Filter by is_completed if provided
        if (is_completed !== undefined) {
            where.is_completed = is_completed;
        }

        // Filter by priority if provided
        if (priority !== undefined) {
            where.priority = priority;
        }

        // Search in title
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const total = await this.prisma.todos.count({ where });
        const todos = await this.prisma.todos.findMany({
            where,
            skip: (page! - 1) * page_size!,
            take: page_size!,
            orderBy: { [sort_by!]: sort_order! },
        });

        return {
            data: omitFromArray(todos, ['deleted_at']),
            meta: {
                total,
                page: page!,
                pageSize: page_size!,
                totalPages: Math.ceil(total / page_size!),
            },
        };
    }

    async findOne(userId: string, id: string) {
        const todo = await this.prisma.todos.findUnique({
            where: { id },
        });

        if (!todo || todo.deleted_at || todo.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        return omit(todo, ['deleted_at']);
    }

    async update(userId: string, id: string, updateTodoDto: UpdateTodoDto) {
        const todo = await this.prisma.todos.findUnique({
            where: { id },
        });

        if (!todo || todo.deleted_at || todo.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        await this.prisma.todos.update({
            where: { id },
            data: updateTodoDto,
        });
    }

    async toggleCompleted(userId: string, id: string) {
        const todo = await this.prisma.todos.findUnique({
            where: { id },
        });

        if (!todo || todo.deleted_at || todo.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        // Toggle the is_completed field
        await this.prisma.todos.update({
            where: { id },
            data: { is_completed: !todo.is_completed },
        });
    }

    async remove(userId: string, id: string) {
        const todo = await this.prisma.todos.findUnique({
            where: { id },
        });

        if (!todo || todo.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        // Check if already soft-deleted
        if (todo.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        // Soft delete by setting deleted_at timestamp
        await this.prisma.todos.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }

    async restore(userId: string, id: string) {
        const todo = await this.prisma.todos.findUnique({
            where: { id },
        });

        if (!todo || todo.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Todo'));
        }

        if (!todo.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.ALREADY_EXISTS('Active Todo'));
        }

        // Restore by setting deleted_at to null
        await this.prisma.todos.update({
            where: { id },
            data: { deleted_at: null },
        });
    }
}
