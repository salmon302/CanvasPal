interface GradeData {
    courseName: string;
    assignments: Array<{
        name: string;
        points: number;
        pointsPossible: number;
        weight: number;
    }>;
}
declare class GradeScraper {
    private static readonly GRADE_TABLE_SELECTOR;
    private static readonly COURSE_NAME_SELECTOR;
    scrapeGrades(): GradeData | null;
    private scrapeAssignments;
    private getAssignmentName;
    private getPoints;
    private getPointsPossible;
    private getWeight;
}
declare const scraper: GradeScraper;
declare const gradeData: GradeData | null;
