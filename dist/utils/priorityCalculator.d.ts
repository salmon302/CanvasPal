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
export declare class PriorityCalculator {
    private static readonly GRADE_THRESHOLDS;
    private static readonly URGENCY_THRESHOLDS;
    private static normalizeWeights;
    private static calculateDueDateFactor;
    private static calculateGradeWeightFactor;
    private static calculateImpactFactor;
    static calculatePriority(assignment: Assignment, allAssignments: Assignment[], weights: PriorityWeights): number;
}
