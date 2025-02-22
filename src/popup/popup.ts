interface Assignment {
    id: string;
    title: string;
    dueDate: Date;
    course: string;
    gradeWeight?: number;
    priorityScore: number;
    completed: boolean;
}

interface Settings {
    icalUrl: string;
    refreshInterval: number;
    priorities: {
        dueDate: number;
        gradeWeight: number;
        gradeImpact: number;
    };
}

class PopupManager {
    private assignmentList: HTMLElement;
    private syncStatus: HTMLElement;
    private dataFreshness: HTMLElement;

    constructor() {
        this.assignmentList = document.getElementById('assignmentList')!;
        this.syncStatus = document.getElementById('sync-status')!;
        this.dataFreshness = document.getElementById('data-freshness')!;
        this.initializeEventListeners();
        this.loadAssignments();
    }

    private initializeEventListeners(): void {
        document.getElementById('openSettings')?.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        // Listen for sync updates
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'SYNC_COMPLETE') {
                this.updateStatus('Synced', new Date());
                this.loadAssignments();
            } else if (message.type === 'SYNC_ERROR') {
                this.updateStatus('Sync Failed', null);
            } else if (message.type === 'ASSIGNMENTS_UPDATED') {
                this.renderAssignments(message.assignments);
            }
        });
    }

    private async loadAssignments(): Promise<void> {
        this.assignmentList.innerHTML = '<div class="loading">Loading assignments...</div>';
        try {
            // Check for settings and URL
            const { settings } = await chrome.storage.sync.get('settings');
            if (!settings) {
                this.assignmentList.innerHTML = '<div class="error">Please configure your settings first</div>';
                return;
            }
            if (!settings.icalUrl) {
                this.assignmentList.innerHTML = '<div class="error">Please set your Canvas iCalendar Feed URL in settings</div>';
                return;
            }

            const response = await chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENTS' });
            if (response.error) {
                this.assignmentList.innerHTML = `<div class="error">Error: ${response.error}</div>`;
                return;
            }
            if (!Array.isArray(response) || response.length === 0) {
                this.assignmentList.innerHTML = '<div class="no-assignments">No assignments found</div>';
                return;
            }
            this.renderAssignments(response);
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.assignmentList.innerHTML = '<div class="error">Failed to load assignments</div>';
        }
    }

    private renderAssignments(assignments: Assignment[]): void {
        if (!assignments.length) {
            this.assignmentList.innerHTML = '<div class="no-assignments">No assignments found</div>';
            return;
        }

        const sortedAssignments = assignments.sort((a, b) => b.priorityScore - a.priorityScore);
        this.assignmentList.innerHTML = sortedAssignments
            .map(assignment => this.createAssignmentElement(assignment))
            .join('');
    }

    private createAssignmentElement(assignment: Assignment): string {
        const priorityClass = this.getPriorityClass(assignment.priorityScore);
        const dueDate = new Date(assignment.dueDate);
        return `
            <div class="assignment-item ${priorityClass}" data-id="${assignment.id}">
                <div class="assignment-header">
                    <h3>${assignment.title}</h3>
                    <div class="completion">
                        <input type="checkbox" 
                               id="complete-${assignment.id}"
                               ${assignment.completed ? 'checked' : ''} 
                               onchange="handleCompletionChange('${assignment.id}', this.checked)" />
                    </div>
                </div>
                <div class="assignment-details">
                    <div class="course">${assignment.course}</div>
                    <div class="due-date">Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</div>
                    ${assignment.gradeWeight ? `<div class="weight">Weight: ${assignment.gradeWeight}%</div>` : ''}
                    <div class="priority">Priority: ${Math.round(assignment.priorityScore * 100)}%</div>
                </div>
            </div>
        `;
    }

    private getPriorityClass(score: number): string {
        if (score >= 0.7) return 'high-priority';
        if (score >= 0.4) return 'medium-priority';
        return 'low-priority';
    }

    private updateStatus(status: string, timestamp: Date | null): void {
        this.syncStatus.textContent = status;
        if (timestamp) {
            this.dataFreshness.textContent = `Updated: ${timestamp.toLocaleTimeString()}`;
        }
    }
}

// Handle completion change globally
(window as any).handleCompletionChange = (assignmentId: string, completed: boolean) => {
    chrome.runtime.sendMessage({
        type: 'UPDATE_COMPLETION',
        assignmentId,
        completed
    });
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
