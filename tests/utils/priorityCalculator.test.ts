import { PriorityCalculator } from '../../src/utils/priorityCalculator';
import { Assignment } from '../../src/types/models';

describe('PriorityCalculator', () => {
    let calculator: PriorityCalculator;
    const baseAssignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        dueDate: new Date(),
        course: 'Test Course',
        type: 'assignment',
        points: 100,
        maxPoints: 100,
        completed: false,
        priorityScore: 0
    };

    beforeEach(() => {
        calculator = new PriorityCalculator();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('calculatePriority', () => {
        it('should give higher priority to assignments due sooner', () => {
            const soonAssignment = {
                ...baseAssignment,
                dueDate: new Date('2024-01-16') // Due tomorrow
            };

            const laterAssignment = {
                ...baseAssignment,
                dueDate: new Date('2024-01-30') // Due in 15 days
            };

            const soonPriority = calculator.calculatePriority(soonAssignment);
            const laterPriority = calculator.calculatePriority(laterAssignment);

            expect(soonPriority).toBeGreaterThan(laterPriority);
        });

        it('should give higher priority to assignments with higher grade impact', () => {
            const highImpact = {
                ...baseAssignment,
                points: 100,
                maxPoints: 100,
                gradeWeight: 0.4
            };

            const lowImpact = {
                ...baseAssignment,
                points: 10,
                maxPoints: 100,
                gradeWeight: 0.1
            };

            const highPriority = calculator.calculatePriority(highImpact);
            const lowPriority = calculator.calculatePriority(lowImpact);

            expect(highPriority).toBeGreaterThan(lowPriority);
        });

        it('should give higher priority to assignments in courses with lower grades', () => {
            const lowGradeCourse = {
                ...baseAssignment,
                courseGrade: 0.65 // 65%
            };

            const highGradeCourse = {
                ...baseAssignment,
                courseGrade: 0.95 // 95%
            };

            const lowGradePriority = calculator.calculatePriority(lowGradeCourse);
            const highGradePriority = calculator.calculatePriority(highGradeCourse);

            expect(lowGradePriority).toBeGreaterThan(highGradePriority);
        });

        it('should apply type-specific weight modifiers correctly', () => {
            const quiz = {
                ...baseAssignment,
                type: 'quiz' as const
            };

            const discussion = {
                ...baseAssignment,
                type: 'discussion' as const
            };

            const quizPriority = calculator.calculatePriority(quiz);
            const discussionPriority = calculator.calculatePriority(discussion);

            expect(quizPriority).toBeGreaterThan(discussionPriority);
        });

        it('should handle missing optional fields gracefully', () => {
            const minimalAssignment = {
                id: '1',
                title: 'Minimal Assignment',
                dueDate: new Date('2024-01-20'),
                course: 'Test Course',
                type: 'assignment' as const,
                completed: false,
                priorityScore: 0
            };

            const priority = calculator.calculatePriority(minimalAssignment);
            expect(priority).toBeGreaterThanOrEqual(0);
            expect(priority).toBeLessThanOrEqual(1);
        });

        it('should respect custom priority weights', () => {
            calculator.setPriorityWeights({
                GRADE_IMPACT: 0.6,
                COURSE_GRADE: 0.2,
                DUE_DATE: 0.2
            });

            const assignment = {
                ...baseAssignment,
                points: 100,
                maxPoints: 100,
                gradeWeight: 0.4,
                courseGrade: 0.8,
                dueDate: new Date('2024-01-20')
            };

            const priority = calculator.calculatePriority(assignment);
            expect(priority).toBeGreaterThan(0);
            expect(priority).toBeLessThan(1);
        });
    });
});