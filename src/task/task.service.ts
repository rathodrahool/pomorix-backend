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

    async create(dto: CreateTaskDto) {
        await this.prisma.tasks.create({
            data: {
                user_id: dto.user_id,
                title: dto.title,
            },
        });
    }

    async findAll(query: FindAllTasksDto) {
        const { page, page_size, sort_by, sort_order, search, user_id, is_active } = query;

        const where: Prisma.tasksWhereInput = {};

        // Always exclude soft-deleted tasks
        where.deleted_at = null;

        // Filter by user_id if provided
        if (user_id) {
            where.user_id = user_id;
        }

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

    async findOne(id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        return omit(task, ['deleted_at']);
    }

    async update(id: string, updateTaskDto: UpdateTaskDto) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        await this.prisma.tasks.update({
            where: { id },
            data: updateTaskDto,
        });
    }

    async toggleActive(id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task || task.deleted_at) {
            throw new NotFoundException(MESSAGE.ERROR.NOT_FOUND('Task'));
        }

        // Toggle the is_active field
        await this.prisma.tasks.update({
            where: { id },
            data: { is_active: !task.is_active },
        });
    }

    async remove(id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task) {
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

    async restore(id: string) {
        const task = await this.prisma.tasks.findUnique({
            where: { id },
        });

        if (!task) {
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
