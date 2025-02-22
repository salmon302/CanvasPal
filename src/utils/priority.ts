interface PriorityWeights {
    dueDate: number;
    gradeWeight: number;
    gradeImpact: number;
}

export function calculatePriorityScore(assignment: {
    dueDate: Date;
    gradeWeight?: number;
    pointsPossible?: number;
    currentScore?: number;
}, weights: PriorityWeights): number {
    const dueDateFactor = calculateDueDateFactor(assignment.dueDate);
    const gradeWeightFactor = calculateGradeWeightFactor(assignment.gradeWeight);
    const impactFactor = calculateImpactFactor(assignment.pointsPossible, assignment.currentScore);

    return (dueDateFactor * weights.dueDate) +
           (gradeWeightFactor * weights.gradeWeight) +
           (impactFactor * weights.gradeImpact);
}

function calculateDueDateFactor(dueDate: Date): number {
    const now = new Date();
    const timeRemaining = dueDate.getTime() - now.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.min(1, 1 - (timeRemaining / oneWeek)));
}

function calculateGradeWeightFactor(weight?: number): number {
    return weight ? weight / 100 : 0.5;
}

function calculateImpactFactor(pointsPossible?: number, currentScore?: number): number {
    if (!pointsPossible || currentScore === undefined) return 0.5;
    return (pointsPossible * (1 - (currentScore / pointsPossible))) / 100;
}
