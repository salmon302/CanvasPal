import { Logger } from './logger';

interface DateDebugInfo {
    totalDates: number;
    types: {
        due: number;
        availability: number;
        unlock: number;
        unknown: number;
    };
    detections: {
        element: string;
        text: string;
        type: string;
        date: string;
    }[];
}

export class DateDebugPanel {
    private panel: HTMLElement | null = null;
    private logger: Logger;

    constructor() {
        this.logger = new Logger('DateDebugPanel');
        this.createPanel();
    }

    private createPanel(): void {
        this.panel = document.createElement('div');
        this.panel.id = 'date-debug-panel';
        this.panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            overflow-y: auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: none;
        `;

        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="color: #ffd700; font-weight: bold;">📅 Date Detection Debug</span>
                <button id="date-debug-close" style="background: none; border: none; color: white; cursor: pointer;">✕</button>
            </div>
        `;
        this.panel.appendChild(header);

        const content = document.createElement('div');
        content.id = 'date-debug-content';
        this.panel.appendChild(content);

        document.body.appendChild(this.panel);

        document.getElementById('date-debug-close')?.addEventListener('click', () => {
            this.toggleVisibility();
        });

        // Add keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleVisibility();
            }
        });
    }

    public toggleVisibility(): void {
        if (this.panel) {
            const isVisible = this.panel.style.display === 'block';
            this.panel.style.display = isVisible ? 'none' : 'block';
        }
    }

    public updateDebugInfo(info: DateDebugInfo): void {
        const content = document.getElementById('date-debug-content');
        if (!content) return;

        content.innerHTML = `
            <div class="date-stats" style="margin-bottom: 15px;">
                <div style="color: #0066cc; margin-bottom: 8px;">
                    Found ${info.totalDates} date${info.totalDates !== 1 ? 's' : ''}
                </div>
                ${this.renderTypeDistribution(info.types)}
            </div>
            <div class="date-detections">
                <div style="color: #ffd700; margin-bottom: 8px;">Detected Dates:</div>
                ${this.renderDetections(info.detections)}
            </div>
        `;
    }

    private renderTypeDistribution(types: DateDebugInfo['types']): string {
        const colors = {
            due: '#ff6b6b',
            availability: '#4CAF50',
            unlock: '#2196F3',
            unknown: '#9e9e9e'
        };

        return Object.entries(types)
            .map(([type, count]) => `
                <div style="margin-left: 10px; color: ${colors[type as keyof typeof colors]};">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}
                </div>
            `).join('');
    }

    private renderDetections(detections: DateDebugInfo['detections']): string {
        return detections
            .map(detection => `
                <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                    <div style="margin-bottom: 4px; color: #90EE90;">
                        ${detection.text}
                    </div>
                    <div style="font-size: 11px; color: #ADD8E6;">
                        Type: ${detection.type}
                    </div>
                    <div style="font-size: 11px; color: #DDA0DD;">
                        Parsed: ${detection.date}
                    </div>
                    <div style="font-size: 11px; color: #FFB6C1;">
                        Element: ${detection.element}
                    </div>
                </div>
            `).join('');
    }

    public logDateDetection(message: string, data?: any): void {
        this.logger.debug(message, data);
    }
}