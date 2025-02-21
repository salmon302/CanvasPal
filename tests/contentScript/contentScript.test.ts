import { GradeDataScraper, GradeData } from '../../src/contentScript/index';
import { chrome } from 'jest-chrome';

describe('GradeDataScraper', () => {
    beforeEach(() => {
        // Setup test DOM
        document.documentElement.innerHTML = `
            <html>
                <body>
                    <div class="course-title">Test Course 101</div>
                    <div class="student_assignments">
                        <div id="assignments-container"></div>
                    </div>
                </body>
            </html>
        `;

        // Mock chrome runtime
        jest.spyOn(chrome.runtime, 'sendMessage').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        document.documentElement.innerHTML = '';
        jest.restoreAllMocks();
    });

    // Helper function to create assignment rows
    const createMockAssignmentRow = (name: string, score: string, possible: string, weight?: string) => {
        const row = document.createElement('div');
        row.className = 'student_assignment';

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = name;

        const grade = document.createElement('div');
        grade.className = 'grade';
        grade.textContent = score;

        const points = document.createElement('div');
        points.className = 'points_possible';
        points.textContent = possible;

        row.appendChild(title);
        row.appendChild(grade);
        row.appendChild(points);

        if (weight) {
            const group = document.createElement('div');
            group.className = 'assignment_group';
            const weightDiv = document.createElement('div');
            weightDiv.className = 'group_weight';
            weightDiv.textContent = weight;
            group.appendChild(weightDiv);
            row.appendChild(group);
        }

        return row;
    };

    // Helper method to add assignment to container
    const addAssignment = (assignment: HTMLElement) => {
        const container = document.getElementById('assignments-container');
        container?.appendChild(assignment);
    };

    describe('Grade Data Scraping', () => {
        it('should correctly scrape assignment data', () => {
            const assignment = createMockAssignmentRow('Test Assignment', '85', '100', '30%');
            document.getElementById('assignments-container')!.appendChild(assignment);
            
            const scraper = new GradeDataScraper();
            const data = scraper.scrapeGradeData();

            expect(data).toBeDefined();
            expect(data.courseName).toBe('Test Course 101');
            expect(data.assignments[0]).toEqual(expect.objectContaining({
                name: 'Test Assignment',
                points: 85
            }));
        });

        it('should handle missing grade data', () => {
            const assignment = createMockAssignmentRow('No Grade Assignment', '-', '100');
            document.body.appendChild(assignment);

            const scraper = new GradeDataScraper();
            const data = scraper.scrapeGradeData();

            expect(data.assignments[0].points).toBe(0);
        });

        it('should handle assignments without weights', () => {
            const assignment = createMockAssignmentRow('No Weight Assignment', '90', '100');
            document.body.appendChild(assignment);

            const scraper = new GradeDataScraper();
            const data = scraper.scrapeGradeData();

            expect(data.assignments[0].weight).toBeUndefined();
        });

        it('should extract course name', () => {
            const courseTitle = document.createElement('div');
            courseTitle.className = 'course-title';
            courseTitle.textContent = 'Test Course 101';
            document.body.appendChild(courseTitle);

            const scraper = new GradeDataScraper();
            const data = scraper.scrapeGradeData();

            expect(data.courseName).toBe('Test Course 101');
        });

        it('should handle malformed grade data', () => {
            const assignment = createMockAssignmentRow('Bad Data', 'not a number', 'also not a number');
            document.body.appendChild(assignment);

            const scraper = new GradeDataScraper();
            const data = scraper.scrapeGradeData();

            expect(data.assignments[0].points).toBe(0);
            expect(data.assignments[0].pointsPossible).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing course title element', () => {
            // Remove course title element
            const courseTitle = document.querySelector('.course-title');
            courseTitle?.remove();

            const scraper = new GradeDataScraper();
            expect(() => scraper.scrapeGradeData()).toThrow('Course title element not found');
        });

        it('should handle empty course title', () => {
            const courseTitle = document.querySelector('.course-title');
            expect(courseTitle).not.toBeNull();
            courseTitle!.textContent = '   ';

            const scraper = new GradeDataScraper();
            expect(() => scraper.scrapeGradeData()).toThrow('Invalid course name');
        });

        it('should log warning when no assignments found', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const scraper = new GradeDataScraper();
            scraper.scrapeGradeData();

            expect(consoleSpy).toHaveBeenCalledWith('No assignment rows found');
            consoleSpy.mockRestore();
        });
    });

    describe('Data Communication', () => {
        beforeEach(() => {
            // Set up mock data for testing
            const assignment = createMockAssignmentRow('Test Assignment', '85', '100', '30%');
            document.body.appendChild(assignment);

            // Mock location object
            Object.defineProperty(window, 'location', {
                value: { href: 'https://canvas.example.com/grades' }
            });
        });

        it('should send grade data to background script', () => {
            new GradeDataScraper();

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'gradeData',
                    data: expect.objectContaining({
                        assignments: expect.arrayContaining([
                            expect.objectContaining({
                                name: 'Test Assignment',
                                points: 85
                            })
                        ])
                    })
                })
            );
        });
    });
});