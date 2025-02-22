import { DateDebugger } from '../../src/utils/dateDebugger';

describe('DateDebugger', () => {
    let dateDebugger: DateDebugger;

    beforeEach(() => {
        document.body.innerHTML = '';
        dateDebugger = new DateDebugger();
    });

    describe('Style Injection', () => {
        it('should inject debug styles into document head', () => {
            const styleElement = document.head.querySelector('style');
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toContain('.debug-date');
        });
    });

    describe('Date Detection', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div>
                    <div class="due-date" data-date="2024-01-20">Due Jan 20, 2024</div>
                    <div class="availability" title="Available until 02/15/2024">Open until Feb 15</div>
                    <span aria-label="Unlocks tomorrow">Not yet available</span>
                    <p>Regular text with embedded date March 1, 2024 in it</p>
                    <div>Assignment due today at 11:59 PM</div>
                    <div>Multiple dates: Due tomorrow and unlocks next monday</div>
                </div>
            `;
        });

        it('should detect dates in attributes', () => {
            const matches = dateDebugger.highlightDates();
            const attributeDates = matches.filter(m => 
                m.element.hasAttribute('data-date') || 
                m.element.hasAttribute('title')
            );
            expect(attributeDates.length).toBeGreaterThan(0);
        });

        it('should detect dates in text content', () => {
            const matches = dateDebugger.highlightDates();
            const textDates = matches.filter(m => 
                !m.element.hasAttribute('data-date') && 
                !m.element.hasAttribute('title')
            );
            expect(textDates.length).toBeGreaterThan(0);
        });

        it('should correctly identify due dates', () => {
            const matches = dateDebugger.highlightDates();
            const dueDates = matches.filter(m => m.type === 'due');
            expect(dueDates.length).toBeGreaterThan(0);
            expect(dueDates[0].element.getAttribute('data-debug-type')).toBe('DUE DATE');
        });

        it('should handle relative dates', () => {
            const matches = dateDebugger.highlightDates();
            const relativeDates = matches.filter(m => 
                m.text.toLowerCase().includes('today') || 
                m.text.toLowerCase().includes('tomorrow')
            );
            expect(relativeDates.length).toBeGreaterThan(0);
        });
    });

    describe('Visual Highlighting', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="assignment">
                    <span class="due-date">Due: 2024-01-20</span>
                </div>
            `;
        });

        it('should apply debug highlight class', () => {
            dateDebugger.highlightDates();
            const highlightedElement = document.querySelector('.debug-date');
            expect(highlightedElement).toBeTruthy();
        });

        it('should set correct data attributes', () => {
            dateDebugger.highlightDates();
            const highlightedElement = document.querySelector('.debug-date');
            expect(highlightedElement?.getAttribute('data-debug-type')).toBeTruthy();
            expect(highlightedElement?.getAttribute('title')).toContain('Detected');
        });

        it('should apply different styles for different date types', () => {
            document.body.innerHTML = `
                <div>
                    <span class="due-date">Due: 2024-01-20</span>
                    <span class="available-date">Available: 2024-01-21</span>
                    <span class="unlock-date">Unlocks: 2024-01-22</span>
                </div>
            `;

            dateDebugger.highlightDates();
            
            const elements = document.querySelectorAll('.debug-date');
            const types = Array.from(elements).map(el => 
                el.getAttribute('data-debug-type')
            );
            
            expect(types).toContain('DUE DATE');
            expect(new Set(types).size).toBeGreaterThan(1); // Should have different types
        });
    });

    describe('Date Parsing', () => {
        it('should parse various date formats', () => {
            document.body.innerHTML = `
                <div>
                    <div>2024-01-20</div>
                    <div>01/20/2024</div>
                    <div>January 20, 2024</div>
                    <div>Jan 20 2024</div>
                </div>
            `;

            const matches = dateDebugger.highlightDates();
            expect(matches.length).toBe(4);
            matches.forEach(match => {
                expect(match.date instanceof Date).toBe(true);
                expect(isNaN(match.date.getTime())).toBe(false);
            });
        });

        it('should handle invalid dates gracefully', () => {
            document.body.innerHTML = `
                <div>
                    <div>Invalid Date</div>
                    <div>2024-13-45</div>
                </div>
            `;

            const matches = dateDebugger.highlightDates();
            expect(matches.length).toBe(0);
        });
    });
});