import { Assignment, PriorityWeights } from '../types/models';
import { Logger } from './logger';
import { DebugPanel } from './debugPanel';
import { PerformanceMonitor } from './performanceMonitor';

export interface Assignment {
    title: string;
    dueDate: Date;
    courseId: string;
    gradeWeight?: number;
    pointsPossible?: number;
    currentScore?: number;
    completed: boolean;
}

export interface PriorityWeights {
    dueDate: number;
    gradeWeight: number;
    impact: number;
}

export class PriorityCalculator {
    private readonly PRIORITY_WEIGHTS: PriorityWeights = {
        GRADE_IMPACT: 0.4,
        COURSE_GRADE: 0.3,
        DUE_DATE: 0.3
    };

    private logger: Logger;
    private debugPanel: DebugPanel;
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        this.logger = new Logger('PriorityCalculator');
        this.debugPanel = new DebugPanel();
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public calculatePriority(assignment: Assignment): number {
        return this.performanceMonitor.monitor('calculatePriority', () => {
            try {
                const metrics = {
                    daysUntilDue: this.performanceMonitor.monitor('calculateDaysUntilDue', 
                        () => this.calculateDaysUntilDue(assignment.dueDate)),
                    gradeImpact: this.performanceMonitor.monitor('calculateGradeImpact', 
                        () => this.calculateGradeImpact(assignment)),
                    courseGradeImpact: this.performanceMonitor.monitor('calculateCourseGradeImpact', 
                        () => this.calculateCourseGradeImpact(assignment)),
                    typeWeight: this.performanceMonitor.monitor('getTypeWeight', 
                        () => this.getTypeWeight(assignment.type))
                };

                // Calculate individual components
                const components = this.performanceMonitor.monitor('calculateComponents', () => ({
                    gradeComponent: metrics.gradeImpact * this.PRIORITY_WEIGHTS.GRADE_IMPACT,
                    courseComponent: metrics.courseGradeImpact * this.PRIORITY_WEIGHTS.COURSE_GRADE,
                    dateComponent: this.calculateDueDatePriority(metrics.daysUntilDue) * this.PRIORITY_WEIGHTS.DUE_DATE
                }));

                // Calculate final priority
                const finalPriority = this.performanceMonitor.monitor('calculateFinalPriority', () => {
                    const basePriority = components.gradeComponent + components.courseComponent + components.dateComponent;
                    return Math.min(Math.max(basePriority * metrics.typeWeight, 0), 1);
                });

                // Log calculation details to debug panel
                this.debugPanel.logDetectionEvent('Priority calculation:', {
                    assignment: assignment.title,
                    components,
                    metrics,
                    finalPriority,
                    performance: this.performanceMonitor.getReport()
                });

                return finalPriority;
            } catch (error) {
                this.logger.error('Error calculating priority:', error);
                return 0;
            }
        }, { assignmentTitle: assignment.title });
    }

    private calculateDaysUntilDue(dueDate: Date): number {
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private calculateDueDatePriority(daysUntilDue: number): number {
        if (daysUntilDue <= 0) return 1; // Overdue assignments get highest priority
        if (daysUntilDue >= 14) return 0.2; // Far future assignments get low priority
        return 1 - (daysUntilDue / 14); // Linear decrease in priority over 14 days
    }

    private calculateGradeImpact(assignment: Assignment): number {
        if (!assignment.points || !assignment.maxPoints) return 0.5; // Default impact if no points info
        return Math.min(assignment.points / 100, 1); // Normalize to 0-1 range
    }

    private calculateCourseGradeImpact(assignment: Assignment): number {
        if (!assignment.courseGrade) return 0.85; // Default if no course grade available
        return 1 - assignment.courseGrade; // Lower grades mean higher priority
    }

    private getTypeWeight(type: Assignment['type']): number {
        switch (type) {
            case 'quiz':
                return 1.2; // Quizzes get 20% boost
            case 'assignment':
                return 1.0; // Standard weight
            case 'discussion':
                return 0.8; // Discussions slightly lower
            case 'announcement':
                return 0.5; // Announcements lowest priority
            default:
                return 1.0;
        }
    }

    public setPriorityWeights(weights: Partial<PriorityWeights>): void {
        const totalWeight = (weights.GRADE_IMPACT || this.PRIORITY_WEIGHTS.GRADE_IMPACT) +
                          (weights.COURSE_GRADE || this.PRIORITY_WEIGHTS.COURSE_GRADE) +
                          (weights.DUE_DATE || this.PRIORITY_WEIGHTS.DUE_DATE);

        if (Math.abs(totalWeight - 1) > 0.001) {
            this.logger.warn('Priority weights do not sum to 1. Using default weights.');
            return;
        }

        Object.assign(this.PRIORITY_WEIGHTS, weights);
        this.logger.info('Priority weights updated:', this.PRIORITY_WEIGHTS);
        this.debugPanel.logDetectionEvent('Priority weights updated:', this.PRIORITY_WEIGHTS);
    }
}
