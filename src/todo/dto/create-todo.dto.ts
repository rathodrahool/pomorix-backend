export interface TodoDto {
    title: string;
    description?: string;
    is_completed: boolean;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type CreateTodoDto = Omit<TodoDto, 'is_completed'>;
export type UpdateTodoDto = Partial<TodoDto>;
