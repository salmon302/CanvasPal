import type { CalendarEvent, PrioritySettings, GradeData, Assignment } from '../types/models';
import { parseICalFeed } from '../utils/calendar';
import { calculatePriority } from '../utils/priorities';
import { logger, LogLevel } from '../utils/logger';
import { AssignmentDetector } from '../utils/assignmentDetector';
import { PriorityCalculator } from '../utils/priorityCalculator';
import { Logger } from '../utils/logger';

interface Settings {
    icalUrl: string;
    refreshInterval: number;
    priorities: {
        dueDate: number;
        gradeWeight: number;
        gradeImpact: number;
    };
}

export interface ICalEvent extends CalendarEvent {
    gradeWeight?: number;
    pointsPossible?: number;
    currentScore?: number;
}

export class BackgroundService {
    private static readonly SYNC_INTERVAL = 30 * 60 * 1000;
    private static readonly RETRY_INTERVAL = 5 * 60 * 1000;
    private gradeData: { [courseId: string]: GradeData } = {};
    private lastSyncTime = 0;
    private syncIntervalId?: number;
    private retryTimeoutId?: number;
    private settings: Settings;
    private assignments: Assignment[] = [];
    private detector: AssignmentDetector;
    private priorityCalculator: PriorityCalculator;
    private logger: Logger;

    constructor() {
        this.settings = {
            icalUrl: '',
            refreshInterval: 30,
            priorities: {
                dueDate: 0.4,
                gradeWeight: 0.3,
                gradeImpact: 0.3
            }
        };
        this.detector = new AssignmentDetector();
        this.priorityCalculator = new PriorityCalculator();
        this.logger = new Logger('BackgroundService');
        this.initialize();
        this.initializeMessageHandlers();
        this.setupAutoRefresh();
    }

    private async initialize(): Promise<void> {
        // Load settings from sync storage
        const { settings } = await chrome.storage.sync.get('settings');
        if (settings) {
            this.settings = settings;
        } else {
            // Initialize default settings if none exist
            await chrome.storage.sync.set({ settings: this.settings });
        }

        // Set up message listeners
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'SETTINGS_UPDATED':
                    this.settings = message.settings;
                    void this.performSync();
                    break;
                case 'GET_ASSIGNMENTS':
                    void this.fetchAndProcessAssignments()
                        .then(sendResponse)
                        .catch(error => sendResponse({ error: error.message }));
                    return true;
            }
        });

        this.startPeriodicSync();
    }

    private initializeMessageHandlers(): void {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async response
        });
    }

    private async handleMessage(
        message: any, 
        sender: chrome.runtime.MessageSender, 
        sendResponse: (response?: any) => void
    ): Promise<void> {
        try {
            switch (message.type) {
                case 'GET_ASSIGNMENTS':
                    const assignments = await this.getAssignments();
                    sendResponse({ assignments });
                    break;

                case 'UPDATE_ASSIGNMENT_COMPLETION':
                    await this.updateAssignmentCompletion(
                        message.assignmentId,
                        message.completed
                    );
                    sendResponse({ success: true });
                    break;

                case 'REFRESH_ASSIGNMENTS':
                    await this.refreshAssignments();
                    sendResponse({ success: true });
                    break;

                default:
                    this.logger.warn('Unknown message type:', message);
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            this.logger.error('Error handling message:', error);
            sendResponse({ error: 'Internal error' });
        }
    }

    private async getAssignments(): Promise<Assignment[]> {
        if (this.assignments.length === 0) {
            await this.refreshAssignments();
        }
        return this.assignments;
    }

    private async refreshAssignments(): Promise<void> {
        try {
            // Get assignments from detector
            const newAssignments = await this.detector.detectAssignments();

            // Calculate priorities for each assignment
            newAssignments.forEach(assignment => {
                assignment.priorityScore = this.priorityCalculator.calculatePriority(assignment);
            });

            // Sort by priority
            newAssignments.sort((a, b) => b.priorityScore - a.priorityScore);

            // Update stored assignments
            this.assignments = newAssignments;

            // Notify any open popups
            this.notifyPopups();

            this.logger.info('Assignments refreshed:', {
                count: newAssignments.length,
                types: this.getAssignmentTypeCounts(newAssignments)
            });
        } catch (error) {
            this.logger.error('Error refreshing assignments:', error);
            throw error;
        }
    }

    private async updateAssignmentCompletion(
        assignmentId: string,
        completed: boolean
    ): Promise<void> {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            assignment.completed = completed;
            await this.saveAssignments();
            this.notifyPopups();
        }
    }

    private async saveAssignments(): Promise<void> {
        try {
            await chrome.storage.local.set({ 
                assignments: this.assignments,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            this.logger.error('Error saving assignments:', error);
            throw error;
        }
    }

    private notifyPopups(): void {
        chrome.runtime.sendMessage({ 
            type: 'ASSIGNMENTS_UPDATED',
            assignments: this.assignments
        }).catch(error => {
            // Ignore errors - popups might not be open
            this.logger.debug('No popups to notify:', error);
        });
    }

    private setupAutoRefresh(): void {
        // Refresh every 30 minutes
        chrome.alarms.create('refreshAssignments', { periodInMinutes: 30 });
        
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'refreshAssignments') {
                await this.refreshAssignments();
            }
        });
    }

    private getAssignmentTypeCounts(assignments: Assignment[]): Record<string, number> {
        return assignments.reduce((counts, assignment) => {
            counts[assignment.type] = (counts[assignment.type] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
    }

    private async fetchCalendarData(url: string): Promise<CalendarEvent[]> {
        const response = await fetch(url);
        const icalData = await response.text();
        return parseICalFeed(icalData);
    }

    private handleGradeData(data: GradeData): void {
        this.gradeData[data.courseName] = data;
        chrome.storage.local.set({ [`grades_${data.courseName}`]: data });
    }

    private startPeriodicSync(): void {
        if (this.syncIntervalId) {
            window.clearInterval(this.syncIntervalId);
            this.syncIntervalId = undefined;
        }
        if (this.retryTimeoutId) {
            window.clearTimeout(this.retryTimeoutId);
            this.retryTimeoutId = undefined;
        }

        void this.performSync();
        const intervalId = window.setInterval(
            () => { void this.performSync(); },
            BackgroundService.SYNC_INTERVAL
        );
        this.syncIntervalId = intervalId;
    }

    private async performSync(): Promise<void> {
        try {
            const now = Date.now();
            if (now - this.lastSyncTime < 60000) {
                return;
            }

            await this.fetchAndProcessAssignments();
            this.lastSyncTime = now;
            await logger.log(LogLevel.INFO, 'Sync completed successfully');
            chrome.runtime.sendMessage({ type: "syncComplete", timestamp: now });
        } catch (error) {
            await logger.log(LogLevel.ERROR, 'Sync failed', error);
            console.error("Sync failed:", error);
            const timeoutId = window.setTimeout(() => {
                void this.performSync();
            }, BackgroundService.RETRY_INTERVAL);
            this.retryTimeoutId = timeoutId;
            chrome.runtime.sendMessage({ 
                type: "syncError", 
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    private async fetchAndProcessAssignments(): Promise<ICalEvent[]> {
        if (!this.settings.icalUrl) {
            throw new Error("iCalendar URL not set");
        }

        try {
            const response = await fetch(this.settings.icalUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
            }
            const icalData = await response.text();
            const assignments = this.parseICalData(icalData);
            return this.enrichAssignmentsWithGrades(assignments);
        } catch (error) {
            console.error("Failed to fetch or parse iCal data:", error);
            throw new Error("Failed to fetch assignments");
        }
    }

    private enrichAssignmentsWithGrades(assignments: ICalEvent[]): ICalEvent[] {
        return assignments.map(assignment => ({
            ...assignment,
            ...this.findGradeInfo(assignment)
        }));
    }

    private findGradeInfo(assignment: CalendarEvent): Partial<ICalEvent> {
        const courseData = this.gradeData[assignment.courseId];
        if (!courseData) return {};

        const gradeInfo = courseData.assignments.find((a: { name: string }) => 
            a.name.toLowerCase() === assignment.title.toLowerCase()
        );

        if (!gradeInfo) return {};

        return {
            gradeWeight: gradeInfo.weight,
            pointsPossible: gradeInfo.pointsPossible,
            currentScore: gradeInfo.points
        };
    }

    private parseICalData(icalData: string): ICalEvent[] {
        return parseICalFeed(icalData).map(event => ({
            ...event,
            courseId: this.extractCourseId(event.courseId)
        }));
    }

    private extractCourseId(description: string): string {
        const courseMatch = description.match(/Course: (.*?)(?:\n|$)/);
        return courseMatch ? courseMatch[1] : "Unknown Course";
    }
}

export const backgroundService = new BackgroundService();

// Set up alarm listener for periodic sync
chrome.alarms.create('sync', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sync') {
        void backgroundService.performSync();
    }
});

// Add keyboard command listener
chrome.commands.onCommand.addListener((command) => {
    if (command === 'refresh-assignments') {
        void backgroundService.performSync();
    }
});
