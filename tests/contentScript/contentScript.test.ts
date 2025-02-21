import { GradeDataScraper, GradeData } from '../../src/contentScript/index';
import { chrome } from 'jest-chrome';

describe('GradeDataScraper', () => {
	let mockDocument: Document;

	beforeEach(() => {
		mockDocument = document.implementation.createHTMLDocument();
		global.document = mockDocument;
	});

	const createMockAssignmentRow = (name: string, score: string, possible: string, weight?: string) => {
		const row = mockDocument.createElement('div');
		row.className = 'student_assignment';

		const title = mockDocument.createElement('div');
		title.className = 'title';
		title.textContent = name;

		const grade = mockDocument.createElement('div');
		grade.className = 'grade';
		grade.textContent = score;

		const points = mockDocument.createElement('div');
		points.className = 'points_possible';
		points.textContent = possible;

		row.appendChild(title);
		row.appendChild(grade);
		row.appendChild(points);

		if (weight) {
			const group = mockDocument.createElement('div');
			group.className = 'assignment_group';
			const weightDiv = mockDocument.createElement('div');
			weightDiv.className = 'group_weight';
			weightDiv.textContent = weight;
			group.appendChild(weightDiv);
			row.appendChild(group);
		}

		return row;
	};

	describe('Grade Data Scraping', () => {
		it('should correctly scrape assignment data', () => {
			const assignment = createMockAssignmentRow('Test Assignment', '85', '100', '30%');
			mockDocument.body.appendChild(assignment);

			const scraper = new GradeDataScraper();
			const data = scraper.scrapeGradeData();

			expect(data.assignments[0]).toEqual({
				name: 'Test Assignment',
				points: 85,
				pointsPossible: 100,
				weight: 30
			});
		});

		it('should handle missing grade data', () => {
			const assignment = createMockAssignmentRow('No Grade Assignment', '-', '100');
			mockDocument.body.appendChild(assignment);

			const scraper = new GradeDataScraper();
			const data = scraper.scrapeGradeData();

			expect(data.assignments[0].points).toBe(0);
		});

		it('should handle assignments without weights', () => {
			const assignment = createMockAssignmentRow('No Weight Assignment', '90', '100');
			mockDocument.body.appendChild(assignment);

			const scraper = new GradeDataScraper();
			const data = scraper.scrapeGradeData();

			expect(data.assignments[0].weight).toBeUndefined();
		});

		it('should extract course name', () => {
			const courseTitle = mockDocument.createElement('div');
			courseTitle.className = 'course-title';
			courseTitle.textContent = 'Test Course 101';
			mockDocument.body.appendChild(courseTitle);

			const scraper = new GradeDataScraper();
			const data = scraper.scrapeGradeData();

			expect(data.courseName).toBe('Test Course 101');
		});

		it('should handle malformed grade data', () => {
			const assignment = createMockAssignmentRow('Bad Data', 'not a number', 'also not a number');
			mockDocument.body.appendChild(assignment);

			const scraper = new GradeDataScraper();
			const data = scraper.scrapeGradeData();

			expect(data.assignments[0].points).toBe(0);
			expect(data.assignments[0].pointsPossible).toBe(0);
		});
	});

	describe('Data Communication', () => {
		it('should send grade data to background script', () => {
			const assignment = createMockAssignmentRow('Test Assignment', '85', '100', '30%');
			mockDocument.body.appendChild(assignment);

			// Simulate being on a grades page
			Object.defineProperty(window, 'location', {
				value: { href: 'https://canvas.example.com/grades' }
			});

			// Initialize scraper (this should trigger data sending)
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