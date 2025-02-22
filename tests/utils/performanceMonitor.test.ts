import { PerformanceMonitor } from '../../src/utils/performanceMonitor';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = PerformanceMonitor.getInstance();
        monitor.clear();
    });

    describe('Singleton Instance', () => {
        it('should return the same instance', () => {
            const instance1 = PerformanceMonitor.getInstance();
            const instance2 = PerformanceMonitor.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Metric Tracking', () => {
        it('should track sync operations', () => {
            const result = monitor.monitor('test-sync', () => {
                const start = Date.now();
                while (Date.now() - start < 50) {} // Simulate work
                return 'done';
            });

            expect(result).toBe('done');
            const report = monitor.getReport();
            expect(report.metrics).toHaveLength(1);
            expect(report.metrics[0].name).toBe('test-sync');
            expect(report.metrics[0].duration).toBeGreaterThan(0);
        });

        it('should track async operations', async () => {
            const result = await monitor.monitorAsync('test-async', async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'done';
            });

            expect(result).toBe('done');
            const report = monitor.getReport();
            expect(report.metrics).toHaveLength(1);
            expect(report.metrics[0].name).toBe('test-async');
            expect(report.metrics[0].duration).toBeGreaterThan(0);
        });

        it('should include metadata in metrics', () => {
            const metadata = { type: 'test', priority: 'high' };
            monitor.monitor('test-with-metadata', () => {}, metadata);

            const report = monitor.getReport();
            expect(report.metrics[0].metadata).toEqual(metadata);
        });
    });

    describe('Performance Report', () => {
        beforeEach(() => {
            // Add some test metrics
            monitor.monitor('fast-op', () => {});
            monitor.monitor('slow-op', () => {
                const start = Date.now();
                while (Date.now() - start < 100) {} // Simulate slow work
            });
        });

        it('should generate correct summary statistics', () => {
            const report = monitor.getReport();
            
            expect(report.summary.totalDuration).toBeGreaterThan(0);
            expect(report.summary.averageDuration).toBeGreaterThan(0);
            expect(report.summary.slowestOperation.name).toBe('slow-op');
            expect(report.summary.fastestOperation.name).toBe('fast-op');
        });

        it('should handle empty metrics', () => {
            monitor.clear();
            const report = monitor.getReport();
            
            expect(report.metrics).toHaveLength(0);
            expect(report.summary.totalDuration).toBe(0);
            expect(report.summary.averageDuration).toBe(0);
            expect(report.summary.slowestOperation.name).toBe('none');
            expect(report.summary.fastestOperation.name).toBe('none');
        });
    });

    describe('Error Handling', () => {
        it('should handle errors in sync operations', () => {
            expect(() => {
                monitor.monitor('error-sync', () => {
                    throw new Error('Test error');
                });
            }).toThrow('Test error');

            const report = monitor.getReport();
            expect(report.metrics[0].name).toBe('error-sync');
            expect(report.metrics[0].duration).toBeDefined();
        });

        it('should handle errors in async operations', async () => {
            await expect(
                monitor.monitorAsync('error-async', async () => {
                    throw new Error('Test error');
                })
            ).rejects.toThrow('Test error');

            const report = monitor.getReport();
            expect(report.metrics[0].name).toBe('error-async');
            expect(report.metrics[0].duration).toBeDefined();
        });
    });
});