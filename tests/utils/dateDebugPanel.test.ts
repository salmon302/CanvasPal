import { DateDebugPanel } from '../../src/utils/dateDebugPanel';

describe('DateDebugPanel', () => {
    let dateDebugPanel: DateDebugPanel;
    const mockDebugInfo = {
        totalDates: 5,
        types: {
            due: 2,
            availability: 1,
            unlock: 1,
            unknown: 1
        },
        detections: [
            {
                element: 'div.due-date',
                text: 'Due Jan 20, 2024',
                type: 'DUE DATE',
                date: '1/20/2024, 12:00:00 AM'
            },
            {
                element: 'span.availability',
                text: 'Available until Feb 15',
                type: 'AVAILABILITY',
                date: '2/15/2024, 12:00:00 AM'
            },
            {
                element: 'div.unlock-date',
                text: 'Unlocks tomorrow',
                type: 'UNLOCK',
                date: '1/16/2024, 12:00:00 AM'
            }
        ]
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        dateDebugPanel = new DateDebugPanel();
    });

    describe('Panel Creation', () => {
        it('should create debug panel with correct structure', () => {
            const panel = document.getElementById('date-debug-panel');
            expect(panel).toBeTruthy();
            expect(panel?.querySelector('#date-debug-content')).toBeTruthy();
            expect(panel?.querySelector('#date-debug-close')).toBeTruthy();
        });

        it('should initially be hidden', () => {
            const panel = document.getElementById('date-debug-panel');
            expect(panel?.style.display).toBe('none');
        });
    });

    describe('Visibility Toggle', () => {
        it('should toggle panel visibility', () => {
            const panel = document.getElementById('date-debug-panel');
            
            dateDebugPanel.toggleVisibility();
            expect(panel?.style.display).toBe('block');

            dateDebugPanel.toggleVisibility();
            expect(panel?.style.display).toBe('none');
        });

        it('should respond to keyboard shortcut', () => {
            const panel = document.getElementById('date-debug-panel');
            
            // Simulate Ctrl+Shift+T
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'T',
                ctrlKey: true,
                shiftKey: true
            }));

            expect(panel?.style.display).toBe('block');
        });

        it('should close when close button is clicked', () => {
            const panel = document.getElementById('date-debug-panel');
            const closeButton = document.getElementById('date-debug-close');

            dateDebugPanel.toggleVisibility(); // Show panel
            expect(panel?.style.display).toBe('block');

            closeButton?.click();
            expect(panel?.style.display).toBe('none');
        });
    });

    describe('Content Updates', () => {
        beforeEach(() => {
            dateDebugPanel.toggleVisibility(); // Show panel
            dateDebugPanel.updateDebugInfo(mockDebugInfo);
        });

        it('should display total date count', () => {
            const content = document.getElementById('date-debug-content');
            expect(content?.textContent).toContain('Found 5 dates');
        });

        it('should show type distribution', () => {
            const content = document.getElementById('date-debug-content');
            expect(content?.textContent).toContain('Due: 2');
            expect(content?.textContent).toContain('Availability: 1');
            expect(content?.textContent).toContain('Unlock: 1');
            expect(content?.textContent).toContain('Unknown: 1');
        });

        it('should render individual date detections', () => {
            const content = document.getElementById('date-debug-content');
            mockDebugInfo.detections.forEach(detection => {
                expect(content?.textContent).toContain(detection.text);
                expect(content?.textContent).toContain(detection.type);
                expect(content?.textContent).toContain(detection.element);
            });
        });

        it('should update content when new info is provided', () => {
            const newInfo = {
                totalDates: 1,
                types: {
                    due: 1,
                    availability: 0,
                    unlock: 0,
                    unknown: 0
                },
                detections: [{
                    element: 'div.new-date',
                    text: 'New date',
                    type: 'DUE DATE',
                    date: '1/30/2024, 12:00:00 AM'
                }]
            };

            dateDebugPanel.updateDebugInfo(newInfo);
            const content = document.getElementById('date-debug-content');
            
            expect(content?.textContent).toContain('Found 1 date');
            expect(content?.textContent).toContain('New date');
            expect(content?.textContent).not.toContain('Found 5 dates');
        });
    });

    describe('Logging', () => {
        it('should log date detection events', () => {
            const spy = jest.spyOn(console, 'debug');
            dateDebugPanel.logDateDetection('Test detection', { date: '2024-01-20' });
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
});