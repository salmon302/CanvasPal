import { Assignment } from '../types/models';
import { Logger } from '../utils/logger';

export class AssignmentRenderer {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('AssignmentRenderer');
    }

    public renderAssignment(assignment: Assignment): HTMLElement {
        const assignmentElement = document.createElement('div');
        assignmentElement.className = this.getAssignmentClasses(assignment);
        assignmentElement.dataset.id = assignment.id;

        assignmentElement.innerHTML = `
            <div class="course-name">${this.escapeHtml(assignment.course)}</div>
            <div class="assignment-header">
                <span class="assignment-type type-${assignment.type}">${this.capitalizeFirstLetter(assignment.type)}</span>
                <span class="priority-score">${Math.round(assignment.priorityScore * 100)}%</span>
            </div>
            <div class="assignment-title">${this.escapeHtml(assignment.title)}</div>
            <div class="assignment-details">
                <div class="detail-item">
                    <span class="detail-icon">⏰</span>
                    <span>${this.formatDueDate(assignment.dueDate)}</span>
                </div>
                ${this.renderPointsDisplay(assignment)}
                ${assignment.details ? this.renderAdditionalDetails(assignment.details) : ''}
            </div>
            <div class="completion">
                <input type="checkbox" 
                    ${assignment.completed ? 'checked' : ''} 
                    title="Mark as complete"
                    onclick="handleCompletionToggle('${assignment.id}', this.checked)">
            </div>
        `;

        return assignmentElement;
    }

    private getAssignmentClasses(assignment: Assignment): string {
        const classes = ['assignment-item'];
        
        // Add priority class
        if (assignment.priorityScore >= 0.7) {
            classes.push('high-priority');
        } else if (assignment.priorityScore >= 0.4) {
            classes.push('medium-priority');
        } else {
            classes.push('low-priority');
        }

        return classes.join(' ');
    }

    private formatDueDate(date: Date): string {
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `Due in ${diffDays} days`;
        }
    }

    private renderPointsDisplay(assignment: Assignment): string {
        if (!assignment.points && !assignment.maxPoints) return '';

        return `
            <div class="detail-item">
                <span class="detail-icon">📊</span>
                <span class="points-display">
                    ${assignment.points || 0} / ${assignment.maxPoints || 0} points
                    ${assignment.gradeWeight ? ` (${Math.round(assignment.gradeWeight * 100)}% of grade)` : ''}
                </span>
            </div>
        `;
    }

    private renderAdditionalDetails(details: Assignment['details']): string {
        if (!details) return '';

        let detailsHtml = '';

        if (details.submissionType?.length) {
            detailsHtml += `
                <div class="detail-item">
                    <span class="detail-icon">📝</span>
                    <span>Submit via: ${details.submissionType.join(', ')}</span>
                </div>
            `;
        }

        if (details.isLocked) {
            detailsHtml += `
                <div class="detail-item">
                    <span class="detail-icon">🔒</span>
                    <span>Locked</span>
                </div>
            `;
        }

        return detailsHtml;
    }

    private escapeHtml(str: string): string {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}