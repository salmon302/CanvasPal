import { DebugPanel } from '../../src/utils/debugPanel';
import { Assignment } from '../../src/types/models';

describe('DebugPanel', () => {
    let debugPanel: DebugPanel;
    const mockAssignments: Assignment[] = [
        {
            id: '1',
            title: 'High Priority Quiz',
            dueDate: new Date('2024-01-20'),
            course: 'Test Course',
            type: 'quiz',
            points: 100,
            maxPoints: 100,
            completed: false,
            priorityScore: 0.8
        },
        {
            id: '2',
            title: 'Medium Priority Assignment',
            dueDate: new Date('2024-02-01'),
            course: 'Test Course',
            type: 'assignment',
            points: 50,
            maxPoints: 100,
            completed: false,
            priorityScore: 0.5
        },
        {
            id: '3',
            title: 'Low Priority Discussion',
            dueDate: new Date('2024-02-15'),
            course: 'Test Course',
            type: 'discussion',
            points: 20,
            maxPoints: 100,
            completed: false,
            priorityScore: 0.3
        }
    ];

    beforeEach(() => {
        document.body.innerHTML = '';
        debugPanel = new DebugPanel();
    });

    describe('Panel Creation', () => {
        it('should create debug panel element', () => {
            const panel = document.getElementById('canvaspal-debug-panel');
            expect(panel).toBeTruthy();
            expect(panel?.style.display).toBe('none');
        });

        it('should include close button', () => {
            const closeButton = document.getElementById('canvaspal-debug-close');
            expect(closeButton).toBeTruthy();
        });
    });

    describe('Visibility Toggle', () => {
        it('should toggle panel visibility', () => {
            const panel = document.getElementById('canvaspal-debug-panel');
            expect(panel?.style.display).toBe('none');

            debugPanel.toggleVisibility();
            expect(panel?.style.display).toBe('block');

            debugPanel.toggleVisibility();
            expect(panel?.style.display).toBe('none');
        });

        it('should respond to keyboard shortcut', () => {
            const panel = document.getElementById('canvaspal-debug-panel');
            
            // Simulate Ctrl+Shift+D
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'D',
                ctrlKey: true,
                shiftKey: true
            }));

            expect(panel?.style.display).toBe('block');
        });
    });

    describe('Assignment Information Display', () => {
        beforeEach(() => {
            debugPanel.toggleVisibility();
            debugPanel.updateAssignmentInfo(mockAssignments);
        });

        it('should display correct number of assignments', () => {
            const content = document.getElementById('canvaspal-debug-content');
            expect(content?.textContent).toContain('Found 3 assignments');
        });

        it('should show correct type distribution', () => {
            const content = document.getElementById('canvaspal-debug-content');
            expect(content?.textContent).toContain('quiz: 1');
            expect(content?.textContent).toContain('assignment: 1');
            expect(content?.textContent).toContain('discussion: 1');
        });

        it('should display priority distribution', () => {
            const content = document.getElementById('canvaspal-debug-content');
            expect(content?.textContent).toContain('high: 1');
            expect(content?.textContent).toContain('medium: 1');
            expect(content?.textContent).toContain('low: 1');
        });

        it('should render individual assignment details', () => {
            const content = document.getElementById('canvaspal-debug-content');
            mockAssignments.forEach(assignment => {
                expect(content?.textContent).toContain(assignment.title);
                expect(content?.textContent).toContain(
                    `${assignment.points}/${assignment.maxPoints} points`
                );
                expect(content?.textContent).toContain(
                    `Priority: ${Math.round(assignment.priorityScore * 100)}%`
                );
            });
        });
    });

    describe('Logging', () => {
        it('should log detection events', () => {
            const spy = jest.spyOn(console, 'debug');
            debugPanel.logDetectionEvent('Test message', { test: 'data' });
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
});