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
declare class PopupManager {
    private assignmentList;
    private syncStatus;
    private dataFreshness;
    constructor();
    private initializeEventListeners;
    private loadAssignments;
    private renderAssignments;
    private createAssignmentElement;
    private getPriorityClass;
    private updateStatus;
}
