/**
 * @fileoverview Calculates priority scores for Canvas assignments using a weighted algorithm
 * that considers due dates, grade impact, and course performance.
 */

import type { Assignment } from '../types/models';

/** Configurable weights for different priority factors */
export interface PriorityWeights {
    /** Weight for how much an assignment affects the final grade (0-1) */
    GRADE_IMPACT: number;
    /** Weight for current course grade consideration (0-1) */
    COURSE_GRADE: number;
    /** Weight for due date proximity (0-1) */
    DUE_DATE: number;
}

import { Logger } from './logger';
import { DebugPanel } from './debugPanel';
import { PerformanceMonitor } from './performanceMonitor';

/**
 * Calculates and manages assignment priorities using a multi-factor algorithm.
 * 
 * The priority calculation considers:
 * - Days until the assignment is due
 * - Potential impact on the course grade
 * - Current course grade
 * - Assignment type (quiz, assignment, discussion, etc.)
 */
export class PriorityCalculator {
    private readonly PRIORITY_WEIGHTS: PriorityWeights = {
        GRADE_IMPACT: 0.4,  // 40% weight for grade impact
        COURSE_GRADE: 0.3,  // 30% weight for course grade
        DUE_DATE: 0.3      // 30% weight for due date
    };
    private logger: Logger;
    private debugPanel: DebugPanel;
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        this.logger = Logger.createLogger('PriorityCalculator');
        this.debugPanel = new DebugPanel();
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    /**
     * Calculates the priority score for an assignment.
     * 
     * @param assignment - The assignment to calculate priority for
     * @returns A priority score between 0 and 1, where 1 is highest priority
     * 
     * Priority is calculated using the formula:
     * Priority = (GradeImpact * GRADE_IMPACT_WEIGHT) +
     *            (CourseGrade * COURSE_GRADE_WEIGHT) +
     *            (DueDate * DUE_DATE_WEIGHT)
     * The result is then adjusted by the assignment type weight.
     */
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

    /**
     * Calculates the number of days until an assignment is due.
     * @param dueDate - The assignment's due date
     * @returns Number of days until due, negative if overdue
     */
    private calculateDaysUntilDue(dueDate: Date): number {
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Converts days until due into a priority factor.
     * - Overdue assignments get maximum priority (1.0)
     * - Assignments due within 14 days get scaled priority
     * - Assignments due after 14 days get minimum priority (0.2)
     */
    private calculateDueDatePriority(daysUntilDue: number): number {
        if (daysUntilDue <= 0) return 1; // Overdue assignments get highest priority
        if (daysUntilDue >= 14) return 0.2; // Far future assignments get low priority
        return 1 - (daysUntilDue / 14); // Linear decrease in priority over 14 days
    }

    /**
     * Calculates how much an assignment could impact the grade.
     * @returns A value between 0-1 representing potential grade impact
     */
    private calculateGradeImpact(assignment: Assignment): number {
        if (!assignment.points || !assignment.maxPoints) return 0.5; // Default impact if no points info
        return Math.min(assignment.points / 100, 1); // Normalize to 0-1 range
    }

    /**
     * Calculates priority factor based on current course grade.
     * Lower grades result in higher priority to help improve performance.
     */
    private calculateCourseGradeImpact(assignment: Assignment): number {
        if (!assignment.courseGrade) return 0.85; // Default if no course grade available
        return 1 - assignment.courseGrade; // Lower grades mean higher priority
    }

    /**
     * Gets the priority multiplier for different assignment types.
     * - Quizzes: 1.2x (highest)
     * - Regular Assignments: 1.0x
     * - Discussions: 0.8x
     * - Announcements: 0.5x (lowest)
     */
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

    /**
     * Updates the weights used in priority calculations.
     * Weights must sum to 1 (within 0.001 tolerance).
     * @param weights - New weights to apply
     */
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
