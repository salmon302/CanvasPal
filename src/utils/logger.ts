export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG'
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
    private static instance: Logger;

    private constructor() {
        this.cleanOldLogs();
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    async log(level: LogLevel, message: string, data?: any): Promise<void> {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            stack: Error().stack
        };

        await this.saveLogs(entry);

        if (level === LogLevel.ERROR) {
            this.notifyError(entry);
        }
    }

    private async saveLogs(entry: LogEntry): Promise<void> {
        const { logs = [] } = await chrome.storage.local.get('logs');
        logs.push(entry);

        if (logs.length > Logger.MAX_LOGS) {
            logs.splice(0, logs.length - Logger.MAX_LOGS);
        }

        await chrome.storage.local.set({ logs });
    }

    private async cleanOldLogs(): Promise<void> {
        const { logs = [] } = await chrome.storage.local.get('logs');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filteredLogs = logs.filter((log: LogEntry) => 
            new Date(log.timestamp) > thirtyDaysAgo
        );

        await chrome.storage.local.set({ logs: filteredLogs });
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

export const logger = Logger.getInstance();
