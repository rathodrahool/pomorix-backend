export interface GlobalFeedQueryDto {
  limit?: number;
}

export interface GlobalFeedItemDto {
  user: {
    id: string;
    email: string;
  };
  task: {
    id: string;
    title: string;
  };
  session: {
    state: string;
    ended_at: Date | null;
    updated_at: Date;
  };
}

export interface GlobalFeedResponseDto {
  online_count: number;
  items: GlobalFeedItemDto[];
}
