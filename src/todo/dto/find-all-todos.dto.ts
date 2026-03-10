export interface FindAllTodosDto {
    page?: number;
    page_size?: number;
    sort_by?: 'created_at' | 'updated_at' | 'title';
    sort_order?: 'asc' | 'desc';
    search?: string;
    is_completed?: boolean;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
