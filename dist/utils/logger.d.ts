export declare enum LogLevel {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG"
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    stack?: string;
}
export declare class Logger {
    private static readonly MAX_LOGS;
    private static instance;
    private constructor();
    static getInstance(): Logger;
    log(level: LogLevel, message: string, data?: any): Promise<void>;
    private saveLogs;
    private cleanOldLogs;
    private notifyError;
    getLogs(level?: LogLevel): Promise<LogEntry[]>;
}
export declare const logger: Logger;
export {};
