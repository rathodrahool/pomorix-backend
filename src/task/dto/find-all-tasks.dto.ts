import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class FindAllTasksDto extends BaseQueryDto {
    declare sort_by?: 'title' | 'created_at' | 'updated_at';
    user_id?: string;
    is_active?: boolean;
}
