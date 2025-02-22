import { Logger } from './logger';
import { DateDebugPanel } from './dateDebugPanel';

interface DateMatch {
    element: HTMLElement;
    date: Date;
    type: 'due' | 'availability' | 'unlock' | 'unknown';
    text: string;
}

export class DateDebugger {
    private logger: Logger;
    private debugPanel: DateDebugPanel;
    private static readonly DATE_DEBUG_STYLES = `
        .debug-date {
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 2px solid #ffd700 !important;
            position: relative !important;
            z-index: 1000;
            padding: 2px !important;
            margin: 2px !important;
            border-radius: 3px !important;
            display: inline-block !important;
        }

        .debug-date::after {
            content: attr(data-debug-type);
            position: absolute;
            top: -20px;
            left: 0;
            background: #ffd700;
            color: black;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 2px;
            z-index: 1001;
            pointer-events: none;
            white-space: nowrap;
        }

        .debug-date[data-debug-type="DUE DATE"] {
            border-color: #ff6b6b !important;
        }

        .debug-date[data-debug-type="DUE DATE"]::after {
            background: #ff6b6b;
            color: white;
        }

        .debug-date[data-debug-type="AVAILABILITY"] {
            border-color: #4CAF50 !important;
        }

        .debug-date[data-debug-type="AVAILABILITY"]::after {
            background: #4CAF50;
            color: white;
        }

        .debug-date[data-debug-type="UNLOCK"] {
            border-color: #2196F3 !important;
        }

        .debug-date[data-debug-type="UNLOCK"]::after {
            background: #2196F3;
            color: white;
        }
    `;

    constructor() {
        this.logger = Logger.createLogger('DateDebugger');
        this.debugPanel = new DateDebugPanel();
        this.injectDebugStyles();
    }

    private injectDebugStyles(): void {
        const styleElement = document.createElement('style');
        styleElement.textContent = DateDebugger.DATE_DEBUG_STYLES;
        document.head.appendChild(styleElement);
    }

    public highlightDates(): DateMatch[] {
        const dateMatches: DateMatch[] = [];
        
        // Common date-containing elements
        const dateElements = document.querySelectorAll<HTMLElement>(
            '[class*="date"], [class*="due"], [class*="deadline"], ' +
            '[aria-label*="due"], [title*="due"], ' +
            '[data-date], [datetime]'
        );

        dateElements.forEach(element => {
            const match = this.processDateElement(element);
            if (match) {
                dateMatches.push(match);
                this.applyDebugHighlight(match);
            }
        });

        // Look for dates in text content
        const textMatches = this.findDatesInTextNodes();
        dateMatches.push(...textMatches);

        // Update debug panel with results
        this.updateDebugPanel(dateMatches);

        this.logger.debug('Found dates:', dateMatches);
        return dateMatches;
    }

    private findDatesInTextNodes(): DateMatch[] {
        const matches: DateMatch[] = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement?.closest('.debug-date')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const hasDate = this.containsDatePattern(node.textContent || '');
                    return hasDate ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node: Text | null;
        while (node = walker.nextNode() as Text) {
            const textMatches = this.findDatesInText(node);
            textMatches.forEach(match => {
                matches.push(match);
                this.applyDebugHighlight(match);
            });
        }

        return matches;
    }

    private updateDebugPanel(matches: DateMatch[]): void {
        const types = {
            due: 0,
            availability: 0,
            unlock: 0,
            unknown: 0
        };

        matches.forEach(match => {
            types[match.type]++;
        });

        const debugInfo = {
            totalDates: matches.length,
            types,
            detections: matches.map(match => ({
                element: this.getElementDescription(match.element),
                text: match.text,
                type: this.getDebugLabel(match.type),
                date: match.date.toLocaleString()
            }))
        };

        this.debugPanel.updateDebugInfo(debugInfo);
    }

    private getElementDescription(element: HTMLElement): string {
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = Array.from(element.classList)
            .filter(cls => !cls.includes('debug-date'))
            .map(cls => `.${cls}`)
            .join('');
        
        return `${tagName}${id}${classes}`;
    }

    private processDateElement(element: HTMLElement): DateMatch | null {
        const dateStr = element.getAttribute('data-date') ||
                       element.getAttribute('datetime') ||
                       element.getAttribute('title') ||
                       element.getAttribute('aria-label') ||
                       element.textContent;

        if (!dateStr) return null;

        const date = this.parseDate(dateStr);
        if (!date) return null;

        const type = this.determineDateType(element, dateStr);
        
        return {
            element,
            date,
            type,
            text: dateStr
        };
    }

    private findDatesInText(node: Text): DateMatch[] {
        const matches: DateMatch[] = [];
        const text = node.textContent || '';
        
        // Common date patterns
        const datePatterns = [
            // ISO format
            /\d{4}-\d{2}-\d{2}/g,
            // MM/DD/YYYY or DD/MM/YYYY
            /\d{1,2}\/\d{1,2}\/\d{4}/g,
            // Month DD, YYYY
            /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/gi,
            // Tomorrow, Today, etc.
            /\b(?:today|tomorrow|yesterday)\b/gi,
            // Next/Last Day
            /(?:next|last) (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi
        ];

        datePatterns.forEach(pattern => {
            const regex = new RegExp(pattern);
            let match;
            while ((match = regex.exec(text)) !== null) {
                const date = this.parseDate(match[0]);
                if (date) {
                    // Create a new span element to wrap the date text
                    const span = document.createElement('span');
                    node.splitText(match.index);
                    const dateNode = node.splitText(match[0].length);
                    span.textContent = match[0];
                    node.parentNode?.replaceChild(span, node);

                    matches.push({
                        element: span,
                        date,
                        type: this.determineDateType(span, match[0]),
                        text: match[0]
                    });
                }
            }
        });

        return matches;
    }

    private parseDate(dateStr: string): Date | null {
        try {
            const normalized = dateStr.toLowerCase();
            
            // Handle relative dates
            if (normalized.includes('today')) {
                return new Date();
            } else if (normalized.includes('tomorrow')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow;
            } else if (normalized.includes('yesterday')) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return yesterday;
            }

            // Try parsing as ISO date first
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // Try other common formats
            const formats = [
                // Add more date formats as needed
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                /(\w+) (\d{1,2}),? (\d{4})/
            ];

            for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        return parsed;
                    }
                }
            }
        } catch (error) {
            this.logger.debug('Date parsing failed:', { dateStr, error });
        }
        return null;
    }

    private determineDateType(element: HTMLElement, text: string): DateMatch['type'] {
        const context = (element.textContent + ' ' +
                        (element.getAttribute('aria-label') || '') + ' ' +
                        (element.getAttribute('title') || '')).toLowerCase();

        if (context.includes('due') || context.includes('deadline')) {
            return 'due';
        } else if (context.includes('available') || context.includes('opens')) {
            return 'availability';
        } else if (context.includes('unlock') || context.includes('start')) {
            return 'unlock';
        }
        return 'unknown';
    }

    private applyDebugHighlight(match: DateMatch): void {
        const element = match.element;
        element.classList.add('debug-date');
        element.setAttribute('data-debug-type', this.getDebugLabel(match.type));
        element.setAttribute('title', `Detected ${match.type} date: ${match.date.toLocaleDateString()}`);
    }

    private getDebugLabel(type: DateMatch['type']): string {
        switch (type) {
            case 'due': return 'DUE DATE';
            case 'availability': return 'AVAILABILITY';
            case 'unlock': return 'UNLOCK';
            default: return 'DATE';
        }
    }

    private containsDatePattern(text: string | null): boolean {
        if (!text) return false;
        return /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}|\b(?:today|tomorrow|yesterday)\b|(?:next|last) (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text);
    }
}