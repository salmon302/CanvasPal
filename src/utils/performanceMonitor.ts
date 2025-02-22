import { Logger } from './logger';
import { DebugPanel } from './debugPanel';
import { PriorityWeights } from '../types/models';

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface PerformanceReport {
    metrics: PerformanceMetric[];
    summary: {
        totalDuration: number;
        averageDuration: number;
        slowestOperation: {
            name: string;
            duration: number;
        };
        fastestOperation: {
            name: string;
            duration: number;
        };
    };
}

export class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private logger: Logger;
    private static instance: PerformanceMonitor;
    private debugPanel: DebugPanel;

    private constructor() {
        this.logger = Logger.createLogger('PerformanceMonitor');
        this.debugPanel = new DebugPanel();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public startMetric(name: string, metadata?: Record<string, any>): string {
        const id = `${name}_${Date.now()}`;
        this.metrics.push({
            name,
            startTime: performance.now(),
            metadata
        });
        return id;
    }

    public endMetric(name: string): void {
        const metric = this.metrics.find(m => m.name === name && !m.endTime);
        if (metric) {
            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            this.logger.debug(`Performance metric - ${name}:`, {
                duration: `${metric.duration.toFixed(2)}ms`,
                metadata: metric.metadata
            });
        }
    }

    public getReport(): PerformanceReport {
        const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
        
        if (completedMetrics.length === 0) {
            return {
                metrics: [],
                summary: {
                    totalDuration: 0,
                    averageDuration: 0,
                    slowestOperation: { name: 'none', duration: 0 },
                    fastestOperation: { name: 'none', duration: 0 }
                }
            };
        }

        const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        const averageDuration = totalDuration / completedMetrics.length;

        const sorted = [...completedMetrics].sort((a, b) => 
            (b.duration || 0) - (a.duration || 0));

        return {
            metrics: completedMetrics,
            summary: {
                totalDuration,
                averageDuration,
                slowestOperation: {
                    name: sorted[0].name,
                    duration: sorted[0].duration || 0
                },
                fastestOperation: {
                    name: sorted[sorted.length - 1].name,
                    duration: sorted[sorted.length - 1].duration || 0
                }
            }
        };
    }

    public clear(): void {
        this.metrics = [];
    }

    public monitorAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
        this.startMetric(name, metadata);
        return fn().finally(() => this.endMetric(name));
    }

    public monitor<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
        this.startMetric(name, metadata);
        const result = fn();
        this.endMetric(name);
        return result;
    }
}