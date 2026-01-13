export interface TaskDto {
    title: string;
    is_active: boolean;
    estimated_pomodoros?: number;
}

export type CreateTaskDto = Omit<TaskDto, 'is_active'>;
export type UpdateTaskDto = Partial<TaskDto>;
