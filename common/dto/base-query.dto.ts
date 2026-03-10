export class BaseQueryDto {
  page?: number = 1;
  page_size?: number = 10;
  sort_by?: string = 'created_at';
  sort_order?: 'asc' | 'desc' = 'desc';
  search?: string;
}
