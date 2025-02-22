export interface CalendarEvent {
    title: string;
    dueDate: Date;
    courseId: string;
    assignmentId: string;
}

export interface PrioritySettings {
    dueDateWeight: number;
    gradeWeight: number;
    difficultyWeight: number;
}

export interface GradeData {
    courseName: string;
    assignments: Array<{
        name: string;
        weight: number;
        points: number;
        pointsPossible: number;
    }>;
}
