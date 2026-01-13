export interface BadgeDefinitionResponseDto {
    id: string;
    code: string;
    title: string;
    description: string;
    category: string;
    is_unlocked: boolean;
    unlocked_at?: string;
}
