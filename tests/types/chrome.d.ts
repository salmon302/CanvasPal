interface StorageData {
    icalUrl?: string;
    weights?: {
        dueDate: number;
        gradeWeight: number;
        impact: number;
    };
    [key: string]: any;
}