import ICAL from 'ical.js';
import { GradeData } from "../contentScript";
import { fetchCalendarData } from '../utils/calendar';
import { calculatePriorities } from '../utils/priorities';

export interface ICalEvent {
    title: string;
    dueDate: Date;
    courseId: string;
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

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        const storedData = await chrome.storage.local.get(null);
        Object.entries(storedData).forEach(([key, value]) => {
            if (key.startsWith("grades_")) {
                const courseName = key.replace("grades_", "");
                this.gradeData[courseName] = value as GradeData;
            }
        });

        chrome.runtime.onInstalled.addListener(() => {
            this.startPeriodicSync();
        });

        this.startPeriodicSync();

        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === "fetchAssignments") {
                this.fetchAndProcessAssignments()
                    .then(sendResponse)
                    .catch(error => sendResponse({ error: error.message }));
                return true;
            }
            if (message.type === "gradeData") {
                this.handleGradeData(message.data);
                sendResponse({ success: true });
                return true;
            }
            if (message.type === "forceSync") {
                this.performSync()
                    .then(() => sendResponse({ success: true }))
                    .catch(error => sendResponse({ error: error.message }));
                return true;
            }
        });
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
            chrome.runtime.sendMessage({ type: "syncComplete", timestamp: now });
        } catch (error) {
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
        const { icalUrl } = await chrome.storage.sync.get("icalUrl");
        if (!icalUrl) {
            throw new Error("iCalendar URL not set");
        }

        try {
            const response = await fetch(icalUrl);
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

    private findGradeInfo(assignment: ICalEvent): Partial<ICalEvent> {
        const courseData = this.gradeData[assignment.courseId];
        if (!courseData) return {};

        const gradeInfo = courseData.assignments.find(a => 
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
        const jcalData = ICAL.parse(icalData);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents("vevent");

        return events.map(event => {
            const titleValue = event.getFirstPropertyValue("summary");
            const dueDateValue = event.getFirstPropertyValue("dtend");
            const description = event.getFirstPropertyValue("description") || "";
            
            if (typeof titleValue !== "string") {
                throw new Error("Invalid title format in iCal data");
            }

            if (!dueDateValue || typeof dueDateValue === "string") {
                throw new Error("Invalid due date format in iCal data");
            }

            return {
                title: titleValue,
                dueDate: dueDateValue.toJSDate(),
                courseId: this.extractCourseId(description.toString())
            };
        });
    }

    private extractCourseId(description: string): string {
        const courseMatch = description.match(/Course: (.*?)(?:\n|$)/);
        return courseMatch ? courseMatch[1] : "Unknown Course";
    }
}

export const backgroundService = new BackgroundService();

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.local.set({
    calendarUrl: '',
    priorities: {
      dueDate: 0.4,
      gradeWeight: 0.3,
      gradeImpact: 0.3
    }
  });
});

// Set up periodic sync
chrome.alarms.create('sync', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync') {
    try {
      const { calendarUrl } = await chrome.storage.local.get('calendarUrl');
      if (calendarUrl) {
        const assignments = await fetchCalendarData(calendarUrl);
        const prioritizedAssignments = calculatePriorities(assignments);
        await chrome.storage.local.set({ assignments: prioritizedAssignments });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
});
