import { Logger } from './logger';

export type TrendType = 'improving' | 'degrading' | 'stable';

export interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: number;
}

export interface PerformanceLog {
    metrics: PerformanceMetric[];
    timestamp: number;
}

interface PerformanceTrend {
    operation: string;
    averageDuration: number;
    trend: TrendType;
    percentageChange: number;
}

export class PerformanceLogger {
    private logger: Logger;
    private static readonly MAX_LOGS = 100;
    private static readonly STORAGE_KEY = 'performanceLogs';
    private static readonly TREND_THRESHOLD = 5; // 5% change threshold
    private metrics: Map<string, PerformanceMetric[]>;

    constructor() {
        this.logger = Logger.createLogger('PerformanceLogger');
        this.metrics = new Map();
    }

    public async logPerformance(metrics: PerformanceLog): Promise<void> {
        try {
            const logs = await this.getLogs();
            logs.unshift(metrics);
            
            // Keep only the most recent logs
            while (logs.length > PerformanceLogger.MAX_LOGS) {
                logs.pop();
            }

            await chrome.storage.local.set({ [PerformanceLogger.STORAGE_KEY]: logs });
            this.logger.debug('Performance log saved:', metrics);
        } catch (error) {
            this.logger.error('Error saving performance log:', error);
        }
    }

    public async getLogs(): Promise<PerformanceLog[]> {
        try {
            const result = await chrome.storage.local.get(PerformanceLogger.STORAGE_KEY);
            return result[PerformanceLogger.STORAGE_KEY] || [];
        } catch (error) {
            this.logger.error('Error retrieving performance logs:', error);
            return [];
        }
    }

    public async getPerformanceAnalysis(): Promise<{
        trends: {
            operation: string;
            averageDuration: number;
            trend: 'improving' | 'degrading' | 'stable';
            percentageChange: number;
        }[];
        hotspots: {
            operation: string;
            frequency: number;
            averageDuration: number;
        }[];
        recommendations: string[];
    }> {
        const logs = await this.getLogs();
        if (logs.length < 2) {
            return {
                trends: [],
                hotspots: [],
                recommendations: ['Not enough data for analysis']
            };
        }

        // Group metrics by operation name
        const operationMetrics: Record<string, number[]> = {};
        logs.forEach(log => {
            log.metrics.forEach(metric => {
                if (!operationMetrics[metric.operation]) {
                    operationMetrics[metric.operation] = [];
                }
                operationMetrics[metric.operation].push(metric.duration);
            });
        });

        // Calculate trends
        const trends = Object.entries(operationMetrics).map(([operation, durations]) => {
            const recent = durations.slice(0, Math.floor(durations.length / 2));
            const older = durations.slice(Math.floor(durations.length / 2));
            
            const recentAvg = this.calculateAverage(recent);
            const olderAvg = this.calculateAverage(older);
            const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

            const trend: TrendType = percentageChange < -5 ? 'improving' :
                                     percentageChange > 5 ? 'degrading' : 'stable';

            return {
                operation,
                averageDuration: recentAvg,
                trend,
                percentageChange
            };
        });

        // Identify hotspots
        const hotspots = Object.entries(operationMetrics)
            .map(([operation, durations]) => ({
                operation,
                frequency: durations.length,
                averageDuration: this.calculateAverage(durations)
            }))
            .filter(h => h.averageDuration > 100 || h.frequency > logs.length * 0.5)
            .sort((a, b) => b.averageDuration * b.frequency - a.averageDuration * a.frequency);

        // Generate recommendations
        const recommendations = this.generateRecommendations(trends, hotspots);

        return { trends, hotspots, recommendations };
    }

    private calculateAverage(numbers: number[]): number {
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    }

    private generateRecommendations(
        trends: { operation: string; trend: TrendType; percentageChange: number }[],
        hotspots: { operation: string; frequency: number; averageDuration: number }[]
    ): string[] {
        const recommendations: string[] = [];

        // Check for degrading performance
        const degradingOps = trends.filter(t => t.trend === 'degrading');
        if (degradingOps.length > 0) {
            recommendations.push(
                `Performance degradation detected in: ${degradingOps
                    .map(op => `${op.operation} (${op.percentageChange.toFixed(1)}% slower)`)
                    .join(', ')}`
            );
        }

        // Check for frequent slow operations
        hotspots.forEach(hotspot => {
            if (hotspot.averageDuration > 200) {
                recommendations.push(
                    `Consider optimizing ${hotspot.operation} (avg: ${hotspot.averageDuration.toFixed(1)}ms, ` +
                    `called ${hotspot.frequency} times)`
                );
            }
        });

        // Add general recommendations
        if (hotspots.length > 3) {
            recommendations.push('Consider reducing the number of expensive operations running in parallel');
        }

        if (recommendations.length === 0) {
            recommendations.push('Performance is within acceptable ranges');
        }

        return recommendations;
    }

    private calculateTrend(operation: string): { operation: string; averageDuration: number; trend: TrendType; percentageChange: number } {
        const metrics = this.metrics.get(operation) || [];
        if (metrics.length < 2) {
            return {
                operation,
                averageDuration: metrics[0]?.duration || 0,
                trend: 'stable',
                percentageChange: 0
            };
        }

        const recent = metrics.slice(-5);
        const averageDuration = recent.reduce((acc, m) => acc + m.duration, 0) / recent.length;
        const oldAverage = metrics.slice(0, -5).reduce((acc, m) => acc + m.duration, 0) / (metrics.length - 5);
        const percentageChange = ((averageDuration - oldAverage) / oldAverage) * 100;

        const trend: TrendType = 
            Math.abs(percentageChange) < PerformanceLogger.TREND_THRESHOLD ? 'stable' :
            percentageChange < 0 ? 'improving' : 'degrading';

        return {
            operation,
            averageDuration,
            trend,
            percentageChange: Math.abs(percentageChange)
        };
    }

    public async clearLogs(): Promise<void> {
        try {
            await chrome.storage.local.remove(PerformanceLogger.STORAGE_KEY);
            this.logger.info('Performance logs cleared');
        } catch (error) {
            this.logger.error('Error clearing performance logs:', error);
        }
    }

    logOperation(operation: string, duration: number): void {
        const metric: PerformanceMetric = {
            operation,
            duration,
            timestamp: Date.now()
        };

        const metrics = this.metrics.get(operation) || [];
        metrics.push(metric);
        this.metrics.set(operation, metrics);
    }

    generateReport(): PerformanceLog & { trends: Array<{ operation: string; averageDuration: number; trend: TrendType; percentageChange: number }> } {
        const trends = Array.from(this.metrics.keys()).map(op => this.calculateTrend(op));
        const flatMetrics = Array.from(this.metrics.values()).flat();

        return {
            metrics: flatMetrics,
            timestamp: Date.now(),
            trends
        };
    }
}