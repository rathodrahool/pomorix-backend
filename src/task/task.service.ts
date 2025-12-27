import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MESSAGE } from 'src/common/response-messages';
import { omit, omitFromArray } from 'src/common/utils/omit.util';
import { FindAllTasksDto } from './dto/find-all-tasks.dto';

@Injectable()
export class TaskService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateTaskDto) {
        await this.prisma.tasks.create({
            data: {
                user_id: userId,
                title: dto.title,
                estimated_pomodoros: dto.estimated_pomodoros,
            },
        });
    }

    async findAll(userId: string, query: FindAllTasksDto) {
        const { page, page_size, sort_by, sort_order, search, is_active } = query;

        const where: Prisma.tasksWhereInput = {};

        // Always exclude soft-deleted tasks
        where.deleted_at = null;

        // Filter by authenticated user
        where.user_id = userId;

        // Filter by is_active if provided
        if (is_active !== undefined) {
            where.is_active = is_active;
        }

        // Search in title
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const total = await this.prisma.tasks.count({ where });
        const tasks = await this.prisma.tasks.findMany({
            where,
            skip: (page! - 1) * page_size!,
            take: page_size!,
            orderBy: { [sort_by!]: sort_order! },
        });

        return {
            data: omitFromArray(tasks, ['deleted_at']),
            meta: {
                total,
                page: page!,
                pageSize: page_size!,
                totalPages: Math.ceil(total / page_size!),
            },
        };
    }

    async findOne(userId: string, id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at || task.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        return omit(task, ['deleted_at']);
    }

    async update(userId: string, id: string, updateTaskDto: UpdateTaskDto) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at || task.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        await this.prisma.tasks.update({
            where: { id },
            data: updateTaskDto,
        });
    }

    async toggleActive(userId: string, id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at || task.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        // Toggle the is_active field
        await this.prisma.tasks.update({
            where: { id },
            data: { is_active: !task.is_active },
        });
    }

    async remove(userId: string, id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        // Check if already soft-deleted
        if (task.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        // Soft delete by setting deleted_at timestamp
        await this.prisma.tasks.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }

    async restore(userId: string, id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.user_id !== userId) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        if (!task.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.ALREADY_EXISTS('Active Task'));
        }

        // Restore by setting deleted_at to null
        await this.prisma.tasks.update({
            where: { id },
            data: { deleted_at: null },
        });
    }
}
