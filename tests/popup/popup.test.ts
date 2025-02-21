import { PopupManager } from '../../src/popup';
import { chrome } from 'jest-chrome';
import { StorageData } from '../../src/types/chrome';

describe('PopupManager', () => {
    let manager: PopupManager;

    // Helper function to initialize DOM and manager
    const setupDOMAndManager = async () => {
        // Setup DOM first
        document.body.innerHTML = `
            <div class="popup-container">
                <div class="url-input">
                    <input type="url" id="ical-url" value="">
                    <button id="sync-button">Sync</button>
                </div>
                <div class="weight-controls">
                    <input type="range" id="due-date-weight" value="33">
                    <input type="range" id="grade-weight" value="33">
                    <input type="range" id="impact-weight" value="34">
                </div>
                <div id="assignments-list"></div>
                <div id="sync-status"></div>
                <div id="error-message"></div>
            </div>
        `;

        // Wait for DOM
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Setup storage mock
        (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
            icalUrl: '',
            weights: { dueDate: 33, gradeWeight: 33, impact: 34 }
        });

        await new Promise(resolve => setTimeout(resolve, 0));
        const popup = new PopupManager();
        await new Promise(resolve => setTimeout(resolve, 0));
        return popup;
    };

    beforeEach(async () => {
        jest.useFakeTimers();
        manager = await setupDOMAndManager();
        jest.runAllTimers();
    });

    // Update test cases to always use setupDOMAndManager
    describe('Initialization', () => {
        it('should load saved settings on startup', async () => {
            const savedSettings: Partial<StorageData> = {
                icalUrl: 'https://example.com/calendar.ics',
                weights: { dueDate: 40, gradeWeight: 30, impact: 30 }
            };

            (chrome.storage.sync.get as jest.Mock).mockResolvedValue(savedSettings);
            
            // Create new instance with new settings
            manager = await setupDOMAndManager();
            await new Promise(resolve => setTimeout(resolve, 0));

            const urlInput = document.getElementById('ical-url') as HTMLInputElement;
            expect(urlInput.value).toBe(savedSettings.icalUrl);
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
            manager = await setupDOMAndManager();
            const urlInput = document.getElementById('ical-url') as HTMLInputElement;
            urlInput.value = 'https://example.com/new-calendar.ics';
            urlInput.dispatchEvent(new Event('change'));

            expect(chrome.storage.sync.set).toHaveBeenCalledWith({
                icalUrl: 'https://example.com/new-calendar.ics'
            });
        });

        it('should update weights when sliders change', async () => {
            const popup = await setupDOMAndManager();
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
            const popup = await setupDOMAndManager();
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

            const messageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
            messageListener({
                type: 'syncComplete',
                timestamp: now
            });

            expect(status?.textContent).toContain('Last synced');
        });
    });
});
