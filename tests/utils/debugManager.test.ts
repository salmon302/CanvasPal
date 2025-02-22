import { DebugManager } from '../../src/utils/debugManager';
import { chrome } from 'jest-chrome';

describe('DebugManager', () => {
    let debugManager: DebugManager;

    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock chrome.storage.sync
        chrome.storage.sync.get.mockImplementation(() => Promise.resolve({}));
        chrome.storage.sync.set.mockImplementation(() => Promise.resolve());
        debugManager = new DebugManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should create debug panels on initialization', () => {
            expect(document.getElementById('canvaspal-debug-panel')).toBeTruthy();
            expect(document.getElementById('date-debug-panel')).toBeTruthy();
        });

        it('should load debug config from storage', () => {
            const mockConfig = {
                enabled: true,
                logLevel: 'debug',
                showDateDebug: true,
                showAssignmentDebug: true,
                showPriorityDebug: true
            };

            chrome.storage.sync.get.mockImplementation(() => 
                Promise.resolve({ debugConfig: mockConfig })
            );

            const newDebugManager = new DebugManager();
            expect(newDebugManager.getConfig()).toEqual(expect.objectContaining(mockConfig));
        });
    });

    describe('Debug Mode Toggle', () => {
        it('should toggle debug mode', () => {
            const initialState = debugManager.isDebugEnabled();
            debugManager.toggleDebugMode();
            expect(debugManager.isDebugEnabled()).toBe(!initialState);
        });

        it('should save config changes to storage', () => {
            debugManager.toggleDebugMode();
            expect(chrome.storage.sync.set).toHaveBeenCalled();
        });

        it('should hide all panels when debug mode is disabled', () => {
            // Enable debug mode first
            debugManager.updateDebugConfig({ enabled: true });
            debugManager.getMainPanel().toggleVisibility();
            debugManager.getDatePanel().toggleVisibility();

            // Then disable it
            debugManager.toggleDebugMode();

            const mainPanel = document.getElementById('canvaspal-debug-panel');
            const datePanel = document.getElementById('date-debug-panel');
            expect(mainPanel?.style.display).toBe('none');
            expect(datePanel?.style.display).toBe('none');
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('should handle debug mode toggle shortcut', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: '`',
                ctrlKey: true,
                shiftKey: true
            }));

            expect(debugManager.isDebugEnabled()).toBe(true);
        });

        it('should handle main panel toggle shortcut', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'D',
                ctrlKey: true,
                shiftKey: true
            }));

            const mainPanel = document.getElementById('canvaspal-debug-panel');
            expect(mainPanel?.style.display).toBe('block');
        });

        it('should handle date panel toggle shortcut', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'T',
                ctrlKey: true,
                shiftKey: true
            }));

            const datePanel = document.getElementById('date-debug-panel');
            expect(datePanel?.style.display).toBe('block');
        });
    });

    describe('Configuration Updates', () => {
        it('should update partial config', () => {
            const newConfig = {
                logLevel: 'debug' as const,
                showDateDebug: true
            };

            debugManager.updateDebugConfig(newConfig);
            const currentConfig = debugManager.getConfig();
            
            expect(currentConfig.logLevel).toBe(newConfig.logLevel);
            expect(currentConfig.showDateDebug).toBe(newConfig.showDateDebug);
        });

        it('should maintain existing config values when partially updating', () => {
            const initialConfig = debugManager.getConfig();
            debugManager.updateDebugConfig({ logLevel: 'warn' as const });
            
            const newConfig = debugManager.getConfig();
            expect(newConfig.enabled).toBe(initialConfig.enabled);
            expect(newConfig.showDateDebug).toBe(initialConfig.showDateDebug);
            expect(newConfig.logLevel).toBe('warn');
        });

        it('should apply visibility changes based on config', () => {
            debugManager.updateDebugConfig({
                enabled: true,
                showDateDebug: true,
                showAssignmentDebug: true
            });

            const datePanel = document.getElementById('date-debug-panel');
            const mainPanel = document.getElementById('canvaspal-debug-panel');
            
            expect(datePanel?.style.display).toBe('block');
            expect(mainPanel?.style.display).toBe('block');
        });
    });

    describe('Panel Access', () => {
        it('should provide access to main debug panel', () => {
            const mainPanel = debugManager.getMainPanel();
            expect(mainPanel).toBeTruthy();
        });

        it('should provide access to date debug panel', () => {
            const datePanel = debugManager.getDatePanel();
            expect(datePanel).toBeTruthy();
        });
    });
});