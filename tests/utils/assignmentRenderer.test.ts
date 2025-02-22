import { AssignmentRenderer } from '../../src/utils/assignmentRenderer';
import { Assignment } from '../../src/types/models';

describe('AssignmentRenderer', () => {
    let renderer: AssignmentRenderer;
    const baseAssignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        dueDate: new Date('2024-01-20'),
        course: 'Test Course',
        type: 'assignment',
        points: 100,
        maxPoints: 100,
        completed: false,
        priorityScore: 0.75
    };

    beforeEach(() => {
        renderer = new AssignmentRenderer();
        document.body.innerHTML = '';
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('renderAssignment', () => {
        it('should render basic assignment information correctly', () => {
            const element = renderer.renderAssignment(baseAssignment);
            
            expect(element.className).toContain('assignment-item');
            expect(element.className).toContain('high-priority');
            expect(element.querySelector('.assignment-title')?.textContent)
                .toBe('Test Assignment');
            expect(element.querySelector('.course-name')?.textContent)
                .toBe('Test Course');
        });

        it('should apply correct priority classes', () => {
            const highPriority = renderer.renderAssignment({
                ...baseAssignment,
                priorityScore: 0.8
            });
            const mediumPriority = renderer.renderAssignment({
                ...baseAssignment,
                priorityScore: 0.5
            });
            const lowPriority = renderer.renderAssignment({
                ...baseAssignment,
                priorityScore: 0.3
            });

            expect(highPriority.className).toContain('high-priority');
            expect(mediumPriority.className).toContain('medium-priority');
            expect(lowPriority.className).toContain('low-priority');
        });

        it('should render different assignment types with correct styling', () => {
            const types: Assignment['type'][] = ['quiz', 'discussion', 'announcement', 'assignment'];
            
            types.forEach(type => {
                const element = renderer.renderAssignment({
                    ...baseAssignment,
                    type
                });

                const typeIndicator = element.querySelector('.assignment-type');
                expect(typeIndicator?.className).toContain(`type-${type}`);
                expect(typeIndicator?.textContent).toBe(type.charAt(0).toUpperCase() + type.slice(1));
            });
        });

        it('should format due dates correctly', () => {
            const dates = [
                { date: new Date('2024-01-14'), expected: 'Overdue by 1 day' },
                { date: new Date('2024-01-15'), expected: 'Due today' },
                { date: new Date('2024-01-16'), expected: 'Due tomorrow' },
                { date: new Date('2024-01-18'), expected: 'Due in 3 days' }
            ];

            dates.forEach(({ date, expected }) => {
                const element = renderer.renderAssignment({
                    ...baseAssignment,
                    dueDate: date
                });

                const dueDate = element.querySelector('.detail-item span:last-child');
                expect(dueDate?.textContent).toBe(expected);
            });
        });

        it('should render points and grade weight when available', () => {
            const element = renderer.renderAssignment({
                ...baseAssignment,
                points: 85,
                maxPoints: 100,
                gradeWeight: 0.4
            });

            const pointsDisplay = element.querySelector('.points-display');
            expect(pointsDisplay?.textContent).toContain('85 / 100 points');
            expect(pointsDisplay?.textContent).toContain('40% of grade');
        });

        it('should render assignment details when available', () => {
            const element = renderer.renderAssignment({
                ...baseAssignment,
                details: {
                    submissionType: ['online_text_entry', 'online_upload'],
                    isCompleted: false,
                    isLocked: true
                }
            });

            const details = element.querySelector('.assignment-details');
            expect(details?.textContent).toContain('Submit via: online_text_entry, online_upload');
            expect(details?.textContent).toContain('Locked');
        });

        it('should escape HTML in user-provided content', () => {
            const element = renderer.renderAssignment({
                ...baseAssignment,
                title: '<script>alert("xss")</script>Test',
                course: '<img src="x" onerror="alert(1)">Course'
            });

            expect(element.querySelector('.assignment-title')?.innerHTML)
                .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Test');
            expect(element.querySelector('.course-name')?.innerHTML)
                .toBe('&lt;img src="x" onerror="alert(1)"&gt;Course');
        });

        it('should render completion checkbox with correct state', () => {
            const completedElement = renderer.renderAssignment({
                ...baseAssignment,
                completed: true
            });

            const incompletedElement = renderer.renderAssignment({
                ...baseAssignment,
                completed: false
            });

            expect(completedElement.querySelector('input[type="checkbox"]'))
                .toHaveProperty('checked', true);
            expect(incompletedElement.querySelector('input[type="checkbox"]'))
                .toHaveProperty('checked', false);
        });
    });
});