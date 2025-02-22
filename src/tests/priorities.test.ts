import { calculatePriority } from '../utils/priorities';
import type { CalendarEvent, PrioritySettings } from '../types/models';

describe('Priority Calculation', () => {
    const baseSettings: PrioritySettings = {
        dueDateWeight: 0.4,
        gradeWeight: 0.3,
        difficultyWeight: 0.3
    };

    const createEvent = (
        daysFromNow: number, 
        gradeWeight?: number,
        pointsPossible?: number,
        currentScore?: number
    ): CalendarEvent & { 
        gradeWeight?: number;
        pointsPossible?: number;
        currentScore?: number;
    } => ({
        title: 'Test Assignment',
        dueDate: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000),
        courseId: 'TEST101',
        assignmentId: 'test-1',
        gradeWeight,
        pointsPossible,
        currentScore
    });

    describe('Due Date Priority', () => {
        test('assignments due sooner should have higher priority', () => {
            const soonEvent = createEvent(1);  // due tomorrow
            const laterEvent = createEvent(7); // due in a week
            
            const soonPriority = calculatePriority(soonEvent, baseSettings);
            const laterPriority = calculatePriority(laterEvent, baseSettings);
            
            expect(soonPriority).toBeGreaterThan(laterPriority);
        });

        test('overdue assignments should have maximum due date priority', () => {
            const overdueEvent = createEvent(-1); // due yesterday
            const priority = calculatePriority(overdueEvent, baseSettings);
            
            expect(priority).toBe(10 * baseSettings.dueDateWeight);
        });

        test('assignments more than 10 days away should have minimum due date priority', () => {
            const farEvent = createEvent(15);
            const priority = calculatePriority(farEvent, baseSettings);
            
            expect(priority).toBe(0);
        });
    });

    describe('Grade Weight Priority', () => {
        test('assignments with higher grade weight should have higher priority', () => {
            const highWeightEvent = createEvent(5, 40); // 40% of grade
            const lowWeightEvent = createEvent(5, 10);  // 10% of grade
            
            const highPriority = calculatePriority(highWeightEvent, baseSettings);
            const lowPriority = calculatePriority(lowWeightEvent, baseSettings);
            
            expect(highPriority).toBeGreaterThan(lowPriority);
        });

        test('missing grade weight should use default middle priority', () => {
            const noWeightEvent = createEvent(5);
            const midWeightEvent = createEvent(5, 50);
            
            const noWeightPriority = calculatePriority(noWeightEvent, baseSettings);
            const midWeightPriority = calculatePriority(midWeightEvent, baseSettings);
            
            expect(noWeightPriority).toBeLessThan(midWeightPriority);
            expect(noWeightPriority).toBeGreaterThan(0);
        });
    });

    describe('Grade Impact Priority', () => {
        test('assignments with greater potential grade improvement should have higher priority', () => {
            const lowScoreEvent = createEvent(5, 30, 100, 60);  // Current score: 60%
            const highScoreEvent = createEvent(5, 30, 100, 90); // Current score: 90%
            
            const lowScorePriority = calculatePriority(lowScoreEvent, baseSettings);
            const highScorePriority = calculatePriority(highScoreEvent, baseSettings);
            
            expect(lowScorePriority).toBeGreaterThan(highScorePriority);
        });

        test('assignments with grade below C should have increased priority', () => {
            const belowCEvent = createEvent(5, 30, 100, 65);    // Below C (70%)
            const aboveCEvent = createEvent(5, 30, 100, 75);    // Above C
            
            const belowCPriority = calculatePriority(belowCEvent, baseSettings);
            const aboveCPriority = calculatePriority(aboveCEvent, baseSettings);
            
            expect(belowCPriority).toBeGreaterThan(aboveCPriority);
        });

        test('missing grade data should use default middle priority', () => {
            const noGradeEvent = createEvent(5, 30);
            const midGradeEvent = createEvent(5, 30, 100, 75);
            
            const noGradePriority = calculatePriority(noGradeEvent, baseSettings);
            
            expect(noGradePriority).toBeGreaterThan(0);
            expect(noGradePriority).toBeLessThan(1);
        });
    });

    describe('Combined Factors', () => {
        test('urgent low-grade high-weight assignment should have very high priority', () => {
            const urgentImportantEvent = createEvent(1, 40, 100, 65); // Due tomorrow, 40% weight, 65% score
            const laterLessImportantEvent = createEvent(7, 10, 100, 85); // Due in a week, 10% weight, 85% score
            
            const urgentPriority = calculatePriority(urgentImportantEvent, baseSettings);
            const laterPriority = calculatePriority(laterLessImportantEvent, baseSettings);
            
            expect(urgentPriority).toBeGreaterThan(laterPriority * 1.5);
        });

        test('custom weight distribution should affect priority accordingly', () => {
            const customSettings: PrioritySettings = {
                dueDateWeight: 0.6,    // Heavily weight due dates
                gradeWeight: 0.3,
                difficultyWeight: 0.1
            };

            const soonEvent = createEvent(1, 10, 100, 80);    // Due soon but lower weight
            const laterEvent = createEvent(5, 40, 100, 60);   // Due later but higher weight and lower grade
            
            const soonPriority = calculatePriority(soonEvent, customSettings);
            const laterPriority = calculatePriority(laterEvent, customSettings);
            
            // With heavy due date weight, the soon event should be higher priority
            expect(soonPriority).toBeGreaterThan(laterPriority);
        });
    });

    describe('Weight Normalization', () => {
        test('priority score should be between 0 and 1', () => {
            const event = createEvent(1);
            const priority = calculatePriority(event, baseSettings);
            
            expect(priority).toBeGreaterThanOrEqual(0);
            expect(priority).toBeLessThanOrEqual(1);
        });

        test('weights should sum to 1', () => {
            const weights = {
                dueDateWeight: 2,
                gradeWeight: 2,
                difficultyWeight: 1
            };
            
            const event = createEvent(1);
            const priority = calculatePriority(event, weights);
            
            expect(priority).toBeGreaterThanOrEqual(0);
            expect(priority).toBeLessThanOrEqual(1);
        });
    });
});