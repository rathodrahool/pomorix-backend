import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export interface FindAllTasksDto {
    page?: number;
    page_size?: number;
    sort_by?: 'created_at' | 'updated_at' | 'title';
    sort_order?: 'asc' | 'desc';
    search?: string;
    is_active?: boolean;
}
