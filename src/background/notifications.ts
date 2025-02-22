import { Assignment } from '../types/models';

export class NotificationManager {
    constructor() {
        this.checkUpcomingAssignments();
    }

    private async checkUpcomingAssignments(): Promise<void> {
        const { assignments } = await chrome.storage.local.get('assignments');
        const { settings } = await chrome.storage.sync.get('settings');

        if (!assignments || !settings) return;

        const now = new Date();
        assignments.forEach((assignment: Assignment) => {
            if (assignment.completed) return;

            const timeUntilDue = assignment.dueDate.getTime() - now.getTime();
            if (timeUntilDue <= settings.notifications.notifyBefore &&
                timeUntilDue > 0 &&
                (!settings.notifications.onlyHighPriority || assignment.priorityScore >= 0.7)) {
                this.createNotification(assignment);
            }
        });
    }

    private createNotification(assignment: Assignment): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Assignment Due Soon',
            message: `${assignment.title} is due ${this.formatTimeRemaining(assignment.dueDate)}`,
            priority: 2
        });
    }

    private formatTimeRemaining(dueDate: Date): string {
        const hours = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60));
        return hours > 24 ? `in ${Math.floor(hours / 24)} days` : `in ${hours} hours`;
    }
}
