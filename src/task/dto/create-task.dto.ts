export interface TaskDto {
    user_id: string;
    title: string;
    is_active: boolean;
}

export type CreateTaskDto = Omit<TaskDto, 'is_active'>;
export type UpdateTaskDto = Partial<Omit<TaskDto, 'user_id'>>;
