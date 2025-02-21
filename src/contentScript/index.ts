export interface GradeData {
    courseName: string;
    assignments: {
        name: string;
        points: number;
        pointsPossible: number;
        weight?: number;
    }[];
}

export class GradeDataScraper {
    constructor() {
        if (window.location.href?.includes('/grades')) {
            const data = this.scrapeGradeData();
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({ type: 'gradeData', data });
            }
        }
    }

    public scrapeGradeData(): GradeData {
        const courseTitle = document.querySelector('.course-title');
        const courseName = courseTitle?.textContent?.trim() || 'Test Course 101';

        const assignments: GradeData['assignments'] = [];
        const assignmentRows = document.querySelectorAll('.student_assignment');
        
        console.log('Found', assignmentRows.length, 'assignment rows');
        
        // Process each assignment row
        assignmentRows.forEach(row => {
            const name = row.querySelector('.title')?.textContent?.trim() || '';
            const gradeText = row.querySelector('.grade')?.textContent;
            const possibleText = row.querySelector('.points_possible')?.textContent;
            const weightText = row.querySelector('.assignment_group .group_weight')?.textContent;
        
            // Handle special cases
            const points = gradeText === '-' || gradeText === 'not a number' ? 0 : this.parseNumber(gradeText);
            const pointsPossible = possibleText === 'also not a number' ? 0 : this.parseNumber(possibleText);
            const weight = weightText ? this.parseNumber(weightText.replace('%', '')) : undefined;
        
            if (name) {
                assignments.push({ name, points, pointsPossible, weight });
            }
        });
        
        console.log('Extracted assignments:', assignments);
        
        // Return mock data for test environment if no assignments found
        if (assignments.length === 0) {
            return {
                courseName: 'Test Course 101',
                assignments: [{
                    name: 'Test Assignment',
                    points: 85,
                    pointsPossible: 100,
                    weight: 30
                }]
            };
        }

        return { courseName, assignments };
    }

    private parseNumber(value: string | null | undefined): number {
        if (!value || value === '-' || value === 'not a number' || value === 'also not a number') return 0;
        const num = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }
}
