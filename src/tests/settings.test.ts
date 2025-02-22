import { chrome } from 'jest-chrome';

describe('Settings Management', () => {
    beforeEach(() => {
        // Mock chrome.storage.sync
        chrome.storage.sync.get.mockImplementation((key) => Promise.resolve({}));
        chrome.storage.sync.set.mockImplementation(() => Promise.resolve());
        chrome.storage.sync.clear.mockImplementation(() => Promise.resolve());
    });

    test('saves settings correctly', async () => {
        const settings = {
            icalUrl: 'https://example.com/calendar.ics',
            priorities: {
                dueDate: 0.4,
                gradeWeight: 0.3,
                gradeImpact: 0.3
            },
            refreshInterval: 30
        };

        let storedSettings = {};
        chrome.storage.sync.set.mockImplementation((data) => {
            storedSettings = { ...data };
            return Promise.resolve();
        });

        chrome.storage.sync.get.mockImplementation(() => 
            Promise.resolve(storedSettings)
        );

        await chrome.storage.sync.set({ settings });
        const result = await chrome.storage.sync.get('settings');
        expect(result).toEqual({ settings });
    });
});