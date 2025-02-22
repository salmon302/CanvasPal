export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    stack?: string;
}

export class Logger {
    private static readonly MAX_LOGS = 1000;
    private static instance: Logger | null;
    private context: string;
    private currentLevel: LogLevel;

    // Protected constructor for testing
    protected constructor(context: string, level: LogLevel = LogLevel.INFO) {
        this.context = context;
        this.currentLevel = level;
        this.cleanOldLogs();
    }

    static getInstance(context: string, level: LogLevel = LogLevel.INFO): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(context, level);
        }
        return Logger.instance;
    }

    // Method for testing purposes
    static createLogger(context: string, level: LogLevel = LogLevel.INFO): Logger {
        return new Logger(context, level);
    }

    // For testing - allows resetting the singleton instance
    static resetInstance(): void {
        Logger.instance = null;
    }

    setLevel(level: LogLevel): void {
        this.currentLevel = level;
    }

    debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data);
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (level >= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const prefix = this.getLogPrefix(level);
            const formattedMessage = `[${timestamp}] ${prefix} [${this.context}] ${message}`;

            if (data) {
                const formattedData = this.formatLogData(data);
                console.log(formattedMessage, formattedData);
            } else {
                console.log(formattedMessage);
            }

            const entry: LogEntry = {
                timestamp,
                level,
                message,
                data,
                stack: Error().stack
            };

            this.saveLogs(entry);

            if (level === LogLevel.ERROR) {
                this.notifyError(entry);
            }
        }
    }

    private getLogPrefix(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG:
                return '🔍 DEBUG:';
            case LogLevel.INFO:
                return '📢 INFO:';
            case LogLevel.WARN:
                return '⚠️ WARN:';
            case LogLevel.ERROR:
                return '❌ ERROR:';
            default:
                return '📢';
        }
    }

    private formatLogData(data: any): any {
        if (data instanceof Element) {
            return {
                tagName: data.tagName,
                id: data.id,
                className: data.className,
                textContent: data.textContent?.substring(0, 100) + '...',
                html: data.outerHTML?.substring(0, 200) + '...'
            };
        }

        if (Array.isArray(data)) {
            return data.map(item => this.formatLogData(item));
        }

        if (data && typeof data === 'object') {
            const formatted: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                formatted[key] = this.formatLogData(value);
            }
            return formatted;
        }

        return data;
    }

    private async saveLogs(entry: LogEntry): Promise<void> {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage?.local) {
                return; // Exit silently if chrome.storage is not available (e.g. in tests)
            }
            const { logs = [] } = await chrome.storage.local.get('logs');
            logs.push(entry);

            if (logs.length > Logger.MAX_LOGS) {
                logs.splice(0, logs.length - Logger.MAX_LOGS);
            }

            await chrome.storage.local.set({ logs });
        } catch (error) {
            console.warn('Failed to save logs:', error);
        }
    }

    private async cleanOldLogs(): Promise<void> {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage?.local) {
                return; // Exit silently if chrome.storage is not available (e.g. in tests)
            }
            const result = await chrome.storage.local.get('logs');
            const { logs = [] } = result || {};
            if (logs.length > Logger.MAX_LOGS) {
                const newLogs = logs.slice(-Logger.MAX_LOGS);
                await chrome.storage.local.set({ logs: newLogs });
            }
        } catch (error) {
            console.warn('Failed to clean old logs:', error);
        }
    }

    private notifyError(entry: LogEntry): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'CanvasPal Error',
            message: entry.message,
            priority: 2
        });
    }

    async getLogs(level?: LogLevel): Promise<LogEntry[]> {
        const { logs = [] } = await chrome.storage.local.get('logs');
        return level ? logs.filter((log: LogEntry) => log.level === level) : logs;
    }
}

export const logger = Logger.getInstance('default');
