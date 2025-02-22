import { Assignment } from '../types/models';
import { AssignmentRenderer } from '../utils/assignmentRenderer';
import { Logger } from '../utils/logger';
import { DebugManager } from '../utils/debugManager';

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
    private assignments: Assignment[] = [];
    private renderer: AssignmentRenderer;
    private logger: Logger;
    private debugManager: DebugManager;
    private typeFilter: string = 'all';
    private priorityFilter: string = 'all';

    constructor() {
        this.renderer = new AssignmentRenderer();
        this.logger = new Logger('PopupManager');
        this.debugManager = new DebugManager();
        this.initializeEventListeners();
        this.loadAssignments();
        this.initializeDebugFeatures();
    }

    private initializeEventListeners(): void {
        document.getElementById('typeFilter')?.addEventListener('change', (e) => {
            this.typeFilter = (e.target as HTMLSelectElement).value;
            this.renderAssignments();
        });

        document.getElementById('priorityFilter')?.addEventListener('change', (e) => {
            this.priorityFilter = (e.target as HTMLSelectElement).value;
            this.renderAssignments();
        });

        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.loadAssignments();
        });

        document.getElementById('openSettings')?.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            }
        });

        // Listen for sync updates
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'SYNC_COMPLETE') {
                this.updateLastSyncTime();
                this.loadAssignments();
            } else if (message.type === 'SYNC_ERROR') {
                this.showError('Sync Failed');
            } else if (message.type === 'ASSIGNMENTS_UPDATED') {
                this.assignments = message.assignments;
                this.renderAssignments();
            }
        });
    }

    private async loadAssignments(): Promise<void> {
        try {
            this.setLoading(true);
            
            // Request assignment data from background script
            const response = await chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENTS' });
            
            if (response.error) {
                throw new Error(response.error);
            }

            this.assignments = response.assignments;
            this.updateLastSyncTime();
            this.renderAssignments();
        } catch (error) {
            this.logger.error('Failed to load assignments:', error);
            this.showError('Failed to load assignments. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    private renderAssignments(): void {
        const container = document.getElementById('assignmentList');
        if (!container) return;

        container.innerHTML = '';

        const filteredAssignments = this.filterAssignments();
        
        if (filteredAssignments.length === 0) {
            container.innerHTML = '<div class="no-assignments">No assignments found</div>';
            return;
        }

        filteredAssignments.forEach(assignment => {
            const element = this.renderer.renderAssignment(assignment);
            container.appendChild(element);
        });
    }

    private filterAssignments(): Assignment[] {
        return this.assignments.filter(assignment => {
            if (this.typeFilter !== 'all' && assignment.type !== this.typeFilter) {
                return false;
            }

            if (this.priorityFilter !== 'all') {
                const priority = assignment.priorityScore;
                switch (this.priorityFilter) {
                    case 'high':
                        return priority >= 0.7;
                    case 'medium':
                        return priority >= 0.4 && priority < 0.7;
                    case 'low':
                        return priority < 0.4;
                }
            }

            return true;
        });
    }

    private setLoading(isLoading: boolean): void {
        const status = document.getElementById('sync-status');
        if (status) {
            status.textContent = isLoading ? 'Syncing...' : 'Synced';
            status.className = isLoading ? 'loading' : '';
        }
    }

    private showError(message: string): void {
        const container = document.getElementById('assignmentList');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    private updateLastSyncTime(): void {
        const element = document.getElementById('data-freshness');
        if (element) {
            element.textContent = `Updated: Just now`;
        }
    }

    public async handleCompletionToggle(assignmentId: string, completed: boolean): Promise<void> {
        try {
            await chrome.runtime.sendMessage({ 
                type: 'UPDATE_ASSIGNMENT_COMPLETION',
                assignmentId,
                completed
            });

            // Update local assignment data
            const assignment = this.assignments.find(a => a.id === assignmentId);
            if (assignment) {
                assignment.completed = completed;
                this.renderAssignments();
            }
        } catch (error) {
            this.logger.error('Failed to update assignment completion:', error);
        }
    }

    private initializeDebugFeatures(): void {
        if (this.debugManager.isDebugEnabled()) {
            this.showDebugControls();
        }

        // Listen for debug mode changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.debugConfig) {
                const newConfig = changes.debugConfig.newValue;
                if (newConfig.enabled) {
                    this.showDebugControls();
                } else {
                    this.hideDebugControls();
                }
            }
        });
    }

    private showDebugControls(): void {
        const controls = document.getElementById('debug-controls');
        if (!controls) {
            const container = document.createElement('div');
            container.id = 'debug-controls';
            container.innerHTML = `
                <div class="debug-toolbar">
                    <button id="toggleDateDebug" class="debug-button" title="Toggle Date Debug (Ctrl/Cmd + Shift + T)">
                        📅
                    </button>
                    <button id="toggleAssignmentDebug" class="debug-button" title="Toggle Assignment Debug (Ctrl/Cmd + Shift + D)">
                        🔍
                    </button>
                    <button id="togglePriorityDebug" class="debug-button" title="Toggle Priority Debug">
                        ⚡
                    </button>
                </div>
            `;

            const header = document.querySelector('header');
            if (header) {
                header.appendChild(container);
                this.initializeDebugButtonListeners();
            }
        }
    }

    private hideDebugControls(): void {
        const controls = document.getElementById('debug-controls');
        if (controls) {
            controls.remove();
        }
    }

    private initializeDebugButtonListeners(): void {
        document.getElementById('toggleDateDebug')?.addEventListener('click', () => {
            this.debugManager.getDatePanel().toggleVisibility();
        });

        document.getElementById('toggleAssignmentDebug')?.addEventListener('click', () => {
            this.debugManager.getMainPanel().toggleVisibility();
        });

        document.getElementById('togglePriorityDebug')?.addEventListener('click', () => {
            const config = this.debugManager.getConfig();
            this.debugManager.updateDebugConfig({
                showPriorityDebug: !config.showPriorityDebug
            });
        });
    }
}

// Initialize popup
window.addEventListener('DOMContentLoaded', () => {
    const popup = new PopupManager();
    
    // Expose completion handler for inline event handlers
    (window as any).handleCompletionToggle = (id: string, completed: boolean) => {
        popup.handleCompletionToggle(id, completed);
    };
});
