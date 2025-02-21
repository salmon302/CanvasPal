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
    private static readonly GRADE_THRESHOLDS = {
        A: 90,
        B: 80,
        C: 70,
        D: 60,
        F: 0
    };

    private static readonly URGENCY_THRESHOLDS = {
        CRITICAL: 24 * 60 * 60 * 1000,  // 24 hours
        HIGH: 72 * 60 * 60 * 1000,      // 3 days
        MEDIUM: 168 * 60 * 60 * 1000    // 1 week
    };

    private static normalizeWeights(weights: PriorityWeights): PriorityWeights {
        const total = weights.dueDate + weights.gradeWeight + weights.impact;
        return {
            dueDate: weights.dueDate / total,
            gradeWeight: weights.gradeWeight / total,
            impact: weights.impact / total
        };
    }

    private static calculateDueDateFactor(assignment: Assignment, allAssignments: Assignment[]): number {
        const now = new Date().getTime();
        const dueTime = assignment.dueDate.getTime();
        const timeRemaining = Math.max(0, dueTime - now);

        if (timeRemaining <= 0) return 1;

        let urgencyBonus = 0;
        if (timeRemaining <= this.URGENCY_THRESHOLDS.CRITICAL) {
            urgencyBonus = 0.3;
        } else if (timeRemaining <= this.URGENCY_THRESHOLDS.HIGH) {
            urgencyBonus = 0.2;
        } else if (timeRemaining <= this.URGENCY_THRESHOLDS.MEDIUM) {
            urgencyBonus = 0.1;
        }

        const latestDueDate = Math.max(...allAssignments.map(a => a.dueDate.getTime()));
        const totalTime = Math.max(latestDueDate - now, 1);
        const baseFactor = 1 - (timeRemaining / totalTime);

        return Math.min(1, baseFactor + urgencyBonus);
    }

    private static calculateGradeWeightFactor(assignment: Assignment, allAssignments: Assignment[]): number {
        const weight = assignment.gradeWeight || 0;
        if (weight === 0) return 0;

        const courseAssignments = allAssignments.filter(a => a.courseId === assignment.courseId);
        const maxWeight = Math.max(...courseAssignments.map(a => a.gradeWeight || 0));
        
        const relativeWeight = weight / (maxWeight || 100);
        const absoluteWeight = weight / 100;
        
        return (relativeWeight + absoluteWeight) / 2;
    }

    private static calculateImpactFactor(assignment: Assignment): number {
        if (!assignment.pointsPossible || !assignment.currentScore) {
            return 0.5;
        }

        const currentPercent = (assignment.currentScore / assignment.pointsPossible) * 100;
        const potentialPoints = assignment.pointsPossible - assignment.currentScore;
        const maxPotentialPoints = assignment.pointsPossible;
        const potentialImpact = potentialPoints / maxPotentialPoints;

        let impactMultiplier = 1;
        if (currentPercent < this.GRADE_THRESHOLDS.C) {
            impactMultiplier = 1.5;
        } else if (currentPercent < this.GRADE_THRESHOLDS.B) {
            impactMultiplier = 1.2;
        } else if (currentPercent >= this.GRADE_THRESHOLDS.A) {
            impactMultiplier = 0.8;
        }

        return Math.min(1, potentialImpact * impactMultiplier);
    }

    public static calculatePriority(
        assignment: Assignment,
        allAssignments: Assignment[],
        weights: PriorityWeights
    ): number {
        if (assignment.completed) return 0;

        const normalizedWeights = this.normalizeWeights(weights);
        const dueDateFactor = this.calculateDueDateFactor(assignment, allAssignments);
        const gradeWeightFactor = this.calculateGradeWeightFactor(assignment, allAssignments);
        const impactFactor = this.calculateImpactFactor(assignment);

        return (dueDateFactor * normalizedWeights.dueDate) +
               (gradeWeightFactor * normalizedWeights.gradeWeight) +
               (impactFactor * normalizedWeights.impact);
    }
}
