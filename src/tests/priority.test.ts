import { calculatePriorityScore } from '../utils/priority';

describe('Priority Calculation', () => {
    const mockWeights = {
        dueDate: 0.4,
        gradeWeight: 0.3,
        gradeImpact: 0.3
    };

    test('calculates priority for assignment with all data', () => {
        const assignment = {
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
            gradeWeight: 20,
            pointsPossible: 100,
            currentScore: 0
        };

        const priority = calculatePriorityScore(assignment, mockWeights);
        expect(priority).toBeGreaterThan(0);
        expect(priority).toBeLessThanOrEqual(1);
    });

    test('handles missing grade data gracefully', () => {
        const assignment = {
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        const priority = calculatePriorityScore(assignment, mockWeights);
        expect(priority).toBeGreaterThan(0);
    });
});
