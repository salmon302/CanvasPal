import type { CalendarEvent } from '../types/models';
export interface ICalEvent extends CalendarEvent {
    gradeWeight?: number;
    pointsPossible?: number;
    currentScore?: number;
}
export declare class BackgroundService {
    private static readonly SYNC_INTERVAL;
    private static readonly RETRY_INTERVAL;
    private gradeData;
    private lastSyncTime;
    private syncIntervalId?;
    private retryTimeoutId?;
    constructor();
    private initialize;
    private fetchCalendarData;
    private handleGradeData;
    private startPeriodicSync;
    private performSync;
    private fetchAndProcessAssignments;
    private enrichAssignmentsWithGrades;
    private findGradeInfo;
    private parseICalData;
    private extractCourseId;
}
export declare const backgroundService: BackgroundService;
