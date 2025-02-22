import { Logger } from './logger';
import { DebugPanel } from './debugPanel';
import { DateDebugPanel } from './dateDebugPanel';
import { PerformanceMonitor } from './performanceMonitor';
import { PerformanceLogger } from './performanceLogger';

interface DebugConfig {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    showDateDebug: boolean;
    showAssignmentDebug: boolean;
    showPriorityDebug: boolean;
    showPerformanceMetrics: boolean;
}

export class DebugManager {
    private logger: Logger;
    private mainPanel: DebugPanel;
    private datePanel: DateDebugPanel;
    private performanceMonitor: PerformanceMonitor;
    private performanceLogger: PerformanceLogger;
    private config: DebugConfig = {
        enabled: false,
        logLevel: 'info',
        showDateDebug: false,
        showAssignmentDebug: false,
        showPriorityDebug: false,
        showPerformanceMetrics: false
    };

    constructor() {
        this.logger = new Logger('DebugManager');
        this.mainPanel = new DebugPanel();
        this.datePanel = new DateDebugPanel();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.performanceLogger = new PerformanceLogger();
        this.initializeKeyboardShortcuts();
        this.initializePerformanceLogging();
        this.loadDebugConfig();
    }

    private initializePerformanceLogging(): void {
        // Log performance metrics every 5 minutes if debug mode is enabled
        setInterval(async () => {
            if (this.config.enabled && this.config.showPerformanceMetrics) {
                const report = this.performanceMonitor.getReport();
                await this.performanceLogger.logPerformance({
                    timestamp: Date.now(),
                    metrics: report.metrics,
                    summary: {
                        totalDuration: report.summary.totalDuration,
                        averageDuration: report.summary.averageDuration,
                        slowestOperation: report.summary.slowestOperation.name,
                        fastestOperation: report.summary.fastestOperation.name
                    }
                });

                if (this.config.showPerformanceMetrics) {
                    await this.updatePerformanceAnalysis();
                }
            }
        }, 5 * 60 * 1000);
    }

    private async updatePerformanceAnalysis(): Promise<void> {
        const analysis = await this.performanceLogger.getPerformanceAnalysis();
        this.mainPanel.updatePerformanceAnalysis(analysis);
    }

    private initializeKeyboardShortcuts(): void {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                switch (e.key) {
                    case '`': // Toggle all debug features
                        e.preventDefault();
                        this.toggleDebugMode();
                        break;
                    case 'D': // Main debug panel
                        e.preventDefault();
                        this.mainPanel.toggleVisibility();
                        break;
                    case 'T': // Date debug panel
                        e.preventDefault();
                        this.datePanel.toggleVisibility();
                        break;
                    case 'P': // Performance metrics
                        e.preventDefault();
                        this.togglePerformanceMetrics();
                        break;
                }
            }
        });
    }

    private async togglePerformanceMetrics(): Promise<void> {
        this.config.showPerformanceMetrics = !this.config.showPerformanceMetrics;
        if (this.config.showPerformanceMetrics) {
            await this.updatePerformanceAnalysis();
        }
        this.saveDebugConfig();
    }

    private async loadDebugConfig(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get('debugConfig');
            if (result.debugConfig) {
                this.config = { ...this.config, ...result.debugConfig };
                this.applyConfig();
            }
        } catch (error) {
            this.logger.error('Error loading debug config:', error);
        }
    }

    private async saveDebugConfig(): Promise<void> {
        try {
            await chrome.storage.sync.set({ debugConfig: this.config });
        } catch (error) {
            this.logger.error('Error saving debug config:', error);
        }
    }

    private applyConfig(): void {
        if (!this.config.enabled) {
            this.disableAllPanels();
            return;
        }

        this.logger.setLevel(this.getLogLevel());
        
        if (this.config.showDateDebug) {
            this.datePanel.toggleVisibility();
        }
        
        if (this.config.showAssignmentDebug || this.config.showPriorityDebug) {
            this.mainPanel.toggleVisibility();
        }
    }

    private disableAllPanels(): void {
        const panels = document.querySelectorAll('[id$="-debug-panel"]');
        panels.forEach(panel => {
            (panel as HTMLElement).style.display = 'none';
        });
    }

    public toggleDebugMode(): void {
        this.config.enabled = !this.config.enabled;
        this.applyConfig();
        this.saveDebugConfig();

        this.logger.info(`Debug mode ${this.config.enabled ? 'enabled' : 'disabled'}`);
    }

    public updateDebugConfig(newConfig: Partial<DebugConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
        this.saveDebugConfig();
    }

    private getLogLevel(): number {
        switch (this.config.logLevel) {
            case 'debug': return 0;
            case 'info': return 1;
            case 'warn': return 2;
            case 'error': return 3;
            default: return 1;
        }
    }

    public getMainPanel(): DebugPanel {
        return this.mainPanel;
    }

    public getDatePanel(): DateDebugPanel {
        return this.datePanel;
    }

    public isDebugEnabled(): boolean {
        return this.config.enabled;
    }

    public getConfig(): DebugConfig {
        return { ...this.config };
    }

    public async clearPerformanceLogs(): Promise<void> {
        await this.performanceLogger.clearLogs();
        if (this.config.showPerformanceMetrics) {
            await this.updatePerformanceAnalysis();
        }
    }

    public async getPerformanceAnalysis() {
        return this.performanceLogger.getPerformanceAnalysis();
    }
}