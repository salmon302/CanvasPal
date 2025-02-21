import { PopupManager } from '../../src/popup';
import { chrome } from 'jest-chrome';

describe('PopupManager', () => {
	let mockDocument: Document;

	beforeEach(() => {
		mockDocument = document.implementation.createHTMLDocument();
		global.document = mockDocument;

		const container = mockDocument.createElement('div');
		container.innerHTML = `
			<div class="url-input">
				<input type="url" id="ical-url">
				<button id="sync-button" title="Sync now">Sync</button>
			</div>
			<input type="range" id="due-date-weight" value="33">
			<input type="range" id="grade-weight" value="33">
			<input type="range" id="impact-weight" value="34">
			<div id="assignments-list"></div>
			<div id="sync-status"></div>
			<div id="error-message"></div>
		`;
		mockDocument.body.appendChild(container);

		chrome.storage.sync.clear();
		chrome.storage.local.clear();
	});

	describe('Initialization', () => {
		it('should load saved settings on startup', async () => {
			const savedSettings = {
				icalUrl: 'https://example.com/calendar.ics',
				weights: {
					dueDate: 40,
					gradeWeight: 30,
					impact: 30
				}
			};

			chrome.storage.sync.get.mockImplementation(() => Promise.resolve(savedSettings));

			new PopupManager();
			await Promise.resolve();

			const urlInput = document.getElementById('ical-url') as HTMLInputElement;
			const dueDateWeight = document.getElementById('due-date-weight') as HTMLInputElement;

			expect(urlInput.value).toBe(savedSettings.icalUrl);
			expect(dueDateWeight.value).toBe('40');
		});

		it('should fetch assignments on startup', async () => {
			const mockAssignments = [{
				title: 'Test Assignment',
				dueDate: new Date(),
				courseId: 'COURSE101',
				completed: false
			}];

			chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve(mockAssignments));

			new PopupManager();
			await Promise.resolve();

			const assignmentsList = document.getElementById('assignments-list');
			expect(assignmentsList?.innerHTML).toContain('Test Assignment');
		});
	});

	describe('User Interactions', () => {
		it('should save iCal URL when changed', async () => {
			new PopupManager();
			const urlInput = document.getElementById('ical-url') as HTMLInputElement;
			
			urlInput.value = 'https://example.com/new-calendar.ics';
			urlInput.dispatchEvent(new Event('change'));

			expect(chrome.storage.sync.set).toHaveBeenCalledWith({
				icalUrl: 'https://example.com/new-calendar.ics'
			});
		});

		it('should update weights when sliders change', async () => {
			new PopupManager();
			const weightInput = document.getElementById('due-date-weight') as HTMLInputElement;
			
			weightInput.value = '50';
			weightInput.dispatchEvent(new Event('input'));

			expect(chrome.storage.sync.set).toHaveBeenCalledWith({
				weights: expect.objectContaining({
					dueDate: 50
				})
			});
		});

		it('should handle manual sync button click', async () => {
			new PopupManager();
			const syncButton = document.getElementById('sync-button') as HTMLButtonElement;
			
			syncButton.click();

			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'forceSync'
			});
		});

		it('should toggle assignment completion status', async () => {
			const mockAssignments = [{
				title: 'Test Assignment',
				dueDate: new Date(),
				courseId: 'COURSE101',
				completed: false
			}];

			chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve(mockAssignments));

			new PopupManager();
			await Promise.resolve();

			const checkbox = document.querySelector('.completion-toggle input') as HTMLInputElement;
			checkbox.click();

			expect(chrome.storage.local.set).toHaveBeenCalledWith({
				'assignment_Test Assignment': true
			});
		});
	});

	describe('Error Handling', () => {
		it('should display error messages', async () => {
			chrome.runtime.sendMessage.mockImplementation(() => Promise.reject('Network error'));

			new PopupManager();
			await Promise.resolve();

			const errorMessage = document.getElementById('error-message');
			expect(errorMessage?.textContent).toContain('Failed to fetch assignments');
		});

		it('should show sync status updates', async () => {
			new PopupManager();
			const status = document.getElementById('sync-status');
			const now = Date.now();

			chrome.runtime.onMessage.addListener.mock.calls[0][0]({
				type: 'syncComplete',
				timestamp: now
			});

			expect(status?.textContent).toContain('Last synced');
		});
	});
});
