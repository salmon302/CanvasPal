import { PriorityCalculator } from '../../src/utils/priorityCalculator';

describe('PriorityCalculator', () => {
	const baseAssignment = {
		title: 'Test Assignment',
		dueDate: new Date(),
		courseId: 'COURSE101',
		completed: false
	};

	const baseWeights = {
		dueDate: 33,
		gradeWeight: 33,
		impact: 34
	};

	describe('Due Date Factor', () => {
		it('should give higher priority to assignments due sooner', () => {
			const now = new Date();
			const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
			const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

			const urgent = { ...baseAssignment, dueDate: tomorrow };
			const later = { ...baseAssignment, dueDate: nextWeek };

			const urgentPriority = PriorityCalculator.calculatePriority(urgent, [urgent, later], baseWeights);
			const laterPriority = PriorityCalculator.calculatePriority(later, [urgent, later], baseWeights);

			expect(urgentPriority).toBeGreaterThan(laterPriority);
		});

		it('should apply urgency bonus for critical deadlines', () => {
			const now = new Date();
			const critical = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
			const normal = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

			const criticalAssignment = { ...baseAssignment, dueDate: critical };
			const normalAssignment = { ...baseAssignment, dueDate: normal };

			const criticalPriority = PriorityCalculator.calculatePriority(
				criticalAssignment,
				[criticalAssignment, normalAssignment],
				baseWeights
			);
			const normalPriority = PriorityCalculator.calculatePriority(
				normalAssignment,
				[criticalAssignment, normalAssignment],
				baseWeights
			);

			expect(criticalPriority).toBeGreaterThan(normalPriority * 1.2);
		});
	});

	describe('Grade Weight Factor', () => {
		it('should prioritize assignments with higher grade weights', () => {
			const highWeight = { ...baseAssignment, gradeWeight: 40 };
			const lowWeight = { ...baseAssignment, gradeWeight: 10 };

			const highPriority = PriorityCalculator.calculatePriority(highWeight, [highWeight, lowWeight], baseWeights);
			const lowPriority = PriorityCalculator.calculatePriority(lowWeight, [highWeight, lowWeight], baseWeights);

			expect(highPriority).toBeGreaterThan(lowPriority);
		});

		it('should normalize weights within the same course', () => {
			const assignments = [
				{ ...baseAssignment, courseId: 'COURSE1', gradeWeight: 20 },
				{ ...baseAssignment, courseId: 'COURSE1', gradeWeight: 40 },
				{ ...baseAssignment, courseId: 'COURSE2', gradeWeight: 10 },
				{ ...baseAssignment, courseId: 'COURSE2', gradeWeight: 20 }
			];

			const course1Priority = PriorityCalculator.calculatePriority(assignments[1], assignments, baseWeights);
			const course2Priority = PriorityCalculator.calculatePriority(assignments[3], assignments, baseWeights);

			expect(Math.abs(course1Priority - course2Priority)).toBeLessThan(0.1);
		});
	});

	describe('Impact Factor', () => {
		it('should prioritize assignments with greater potential grade impact', () => {
			const highImpact = {
				...baseAssignment,
				pointsPossible: 100,
				currentScore: 60
			};
			const lowImpact = {
				...baseAssignment,
				pointsPossible: 100,
				currentScore: 90
			};

			const highPriority = PriorityCalculator.calculatePriority(highImpact, [highImpact, lowImpact], baseWeights);
			const lowPriority = PriorityCalculator.calculatePriority(lowImpact, [highImpact, lowImpact], baseWeights);

			expect(highPriority).toBeGreaterThan(lowPriority);
		});

		it('should apply higher multiplier for grades below C threshold', () => {
			const belowC = {
				...baseAssignment,
				pointsPossible: 100,
				currentScore: 65
			};
			const aboveC = {
				...baseAssignment,
				pointsPossible: 100,
				currentScore: 75
			};

			const lowGradePriority = PriorityCalculator.calculatePriority(belowC, [belowC, aboveC], baseWeights);
			const highGradePriority = PriorityCalculator.calculatePriority(aboveC, [belowC, aboveC], baseWeights);

			expect(lowGradePriority).toBeGreaterThan(highGradePriority);
		});
	});

	describe('Completion Status', () => {
		it('should give zero priority to completed assignments', () => {
			const completed = { ...baseAssignment, completed: true };
			const priority = PriorityCalculator.calculatePriority(completed, [completed], baseWeights);
			expect(priority).toBe(0);
		});
	});
});