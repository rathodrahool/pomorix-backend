export enum AnalyticsRange {
    LAST_7_DAYS = 'LAST_7_DAYS',
    LAST_30_DAYS = 'LAST_30_DAYS',
    ALL_TIME = 'ALL_TIME',
}

export interface GetProfileQueryDto {
    range?: AnalyticsRange;
}
