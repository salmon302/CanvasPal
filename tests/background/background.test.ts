import { chrome } from 'jest-chrome';
import { backgroundService } from '../../src/background';

describe('BackgroundService', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		chrome.storage.local.clear();
		chrome.storage.sync.clear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('Initialization', () => {
		it('should load stored grade data on initialization', async () => {
			const storedData = {
				'grades_COURSE101': {
					courseName: 'COURSE101',
					assignments: [
						{ name: 'Assignment 1', points: 85, pointsPossible: 100, weight: 30 }
					]
				}
			};
			chrome.storage.local.get.mockImplementation(() => Promise.resolve(storedData));

			await jest.runAllTimersAsync();
			expect(chrome.storage.local.get).toHaveBeenCalledWith(null);
		});

		it('should start periodic sync on installation', () => {
			const listener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
			listener();
			jest.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'syncComplete' })
			);
		});
	});

	describe('Message Handling', () => {
		it('should handle fetchAssignments message', async () => {
			const sendResponse = jest.fn();

			chrome.storage.sync.get.mockImplementation(() => 
				Promise.resolve({ icalUrl: 'https://example.com/calendar.ics' })
			);

			global.fetch = jest.fn(() =>
				Promise.resolve({
					text: () => Promise.resolve('sample ical data')
				})
			) as jest.Mock;

			chrome.runtime.onMessage.addListener.mock.calls[0][0](
				{ type: 'fetchAssignments' },
				{},
				sendResponse
			);

			expect(sendResponse).toHaveBeenCalled();
		});

		it('should handle gradeData message', async () => {
			const sendResponse = jest.fn();
			const gradeData = {
				courseName: 'COURSE101',
				assignments: [
					{ name: 'Test Assignment', points: 90, pointsPossible: 100 }
				]
			};

			chrome.runtime.onMessage.addListener.mock.calls[0][0](
				{ type: 'gradeData', data: gradeData },
				{},
				sendResponse
			);

			expect(chrome.storage.local.set).toHaveBeenCalledWith(
				expect.objectContaining({
					'grades_COURSE101': gradeData
				})
			);
			expect(sendResponse).toHaveBeenCalledWith({ success: true });
		});
	});

	describe('Sync Functionality', () => {
		it('should retry sync on failure', async () => {
			global.fetch = jest.fn(() => Promise.reject('Network error')) as jest.Mock;

			chrome.storage.sync.get.mockImplementation(() => 
				Promise.resolve({ icalUrl: 'https://example.com/calendar.ics' })
			);

			chrome.runtime.onMessage.addListener.mock.calls[0][0](
				{ type: 'forceSync' },
				{},
				() => {}
			);

			jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes retry interval

			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'syncError' })
			);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should respect minimum sync interval', async () => {
			chrome.runtime.onMessage.addListener.mock.calls[0][0](
				{ type: 'forceSync' },
				{},
				() => {}
			);

			chrome.runtime.onMessage.addListener.mock.calls[0][0](
				{ type: 'forceSync' },
				{},
				() => {}
			);

			expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
		});
	});
});