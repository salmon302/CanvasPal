interface GradeData {
    courseName: string;
    assignments: Array<{
        name: string;
        points: number;
        pointsPossible: number;
        weight: number;
    }>;
}

class GradeScraper {
    private static readonly GRADE_TABLE_SELECTOR = '.student_assignments';
    private static readonly COURSE_NAME_SELECTOR = '.course-title';

    public scrapeGrades(): GradeData | null {
        const courseElement = document.querySelector(GradeScraper.COURSE_NAME_SELECTOR);
        const gradeTable = document.querySelector(GradeScraper.GRADE_TABLE_SELECTOR);

        if (!courseElement || !gradeTable) return null;

        const courseName = courseElement.textContent?.trim() || 'Unknown Course';
        const assignments = this.scrapeAssignments(gradeTable);

        return {
            courseName,
            assignments
        };
    }

    private scrapeAssignments(table: Element): GradeData['assignments'] {
        const rows = table.querySelectorAll('tr.student_assignment');
        return Array.from(rows).map(row => ({
            name: this.getAssignmentName(row),
            points: this.getPoints(row),
            pointsPossible: this.getPointsPossible(row),
            weight: this.getWeight(row)
        }));
    }

    private getAssignmentName(row: Element): string {
        return row.querySelector('.assignment_name')?.textContent?.trim() || 'Unknown Assignment';
    }

    private getPoints(row: Element): number {
        const points = row.querySelector('.grade')?.textContent?.trim();
        return points ? parseFloat(points) : 0;
    }

    private getPointsPossible(row: Element): number {
        const possible = row.querySelector('.points_possible')?.textContent?.trim();
        return possible ? parseFloat(possible) : 0;
    }

    private getWeight(row: Element): number {
        const weight = row.querySelector('.assignment_weight')?.textContent?.trim();
        return weight ? parseFloat(weight) : 0;
    }
}

// Initialize scraper and send data to background service
const scraper = new GradeScraper();
const gradeData = scraper.scrapeGrades();

if (gradeData) {
    chrome.runtime.sendMessage({
        type: 'GRADE_DATA',
        data: gradeData
    });
}
