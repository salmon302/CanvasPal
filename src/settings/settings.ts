interface Settings {
    icalUrl: string;
    refreshInterval: number;
    priorities: {
        dueDate: number;
        gradeWeight: number;
        gradeImpact: number;
    };
    notifications?: {
        notifyBefore: number;
        onlyHighPriority: boolean;
    };
}

class SettingsManager {
    private static readonly DEFAULT_SETTINGS: Settings = {
        icalUrl: '',
        refreshInterval: 30,
        priorities: {
            dueDate: 0.4,
            gradeWeight: 0.3,
            gradeImpact: 0.3
        },
        notifications: {
            notifyBefore: 10,
            onlyHighPriority: false
        }
    };

    constructor() {
        this.initializeSettings();
        this.setupEventListeners();
    }

    private async initializeSettings(): Promise<void> {
        const { settings } = await chrome.storage.sync.get('settings');
        if (!settings) {
            await this.saveSettings(SettingsManager.DEFAULT_SETTINGS);
            this.updateUI(SettingsManager.DEFAULT_SETTINGS);
        } else {
            this.updateUI(settings);
        }
    }

    private updateUI(settings: Settings): void {
        const urlInput = document.getElementById('icalUrl') as HTMLInputElement;
        if (urlInput) {
            urlInput.value = settings.icalUrl || '';
        }
        (document.getElementById('dueDateWeight') as HTMLInputElement).value = 
            ((settings.priorities?.dueDate || 0.4) * 100).toString();
        (document.getElementById('gradeWeight') as HTMLInputElement).value = 
            ((settings.priorities?.gradeWeight || 0.3) * 100).toString();
        (document.getElementById('gradeImpact') as HTMLInputElement).value = 
            ((settings.priorities?.gradeImpact || 0.3) * 100).toString();
    }

    private async saveSettings(settings: Settings): Promise<void> {
        try {
            await chrome.storage.sync.set({ settings });
            // Also save URL separately for compatibility
            await chrome.storage.sync.set({ icalUrl: settings.icalUrl });
            chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    private setupEventListeners(): void {
        const urlInput = document.getElementById('icalUrl');
        if (urlInput) {
            urlInput.addEventListener('change', async () => {
                const settings = await this.getCurrentSettings();
                settings.icalUrl = (urlInput as HTMLInputElement).value;
                await this.saveSettings(settings);
            });
        }

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveCurrentSettings();
        });

        document.getElementById('resetSettings')?.addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        document.getElementById('importFile')?.addEventListener('change', (event) => {
            this.importData(event);
        });
    }

    private async saveCurrentSettings(): Promise<void> {
        const settings: Settings = {
            icalUrl: (document.getElementById('icalUrl') as HTMLInputElement).value,
            refreshInterval: 30,
            priorities: {
                dueDate: parseInt((document.getElementById('dueDateWeight') as HTMLInputElement).value) / 100,
                gradeWeight: parseInt((document.getElementById('gradeWeight') as HTMLInputElement).value) / 100,
                gradeImpact: parseInt((document.getElementById('gradeImpact') as HTMLInputElement).value) / 100
            },
            notifications: {
                notifyBefore: parseInt((document.getElementById('notifyBefore') as HTMLInputElement).value),
                onlyHighPriority: (document.getElementById('onlyHighPriority') as HTMLInputElement).checked
            }
        };

        await this.saveSettings(settings);
        this.showNotification('Settings saved successfully');
    }

    private async resetSettings(): Promise<void> {
        await this.saveSettings(SettingsManager.DEFAULT_SETTINGS);
        this.updateUI(SettingsManager.DEFAULT_SETTINGS);
        this.showNotification('Settings reset to defaults');
    }

    private async exportData(): Promise<void> {
        try {
            const data = await chrome.storage.local.get(null);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canvaspal-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            this.showNotification('Export failed', 'error');
        }
    }

    private async importData(event: Event): Promise<void> {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await chrome.storage.local.clear();
            await chrome.storage.local.set(data);
            this.showNotification('Data imported successfully');
            await this.initializeSettings(); // Fix: Change loadSettings to initializeSettings
        } catch (error) {
            this.showNotification('Import failed', 'error');
        }
    }

    private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    private async getCurrentSettings(): Promise<Settings> {
        const { settings } = await chrome.storage.sync.get('settings');
        return settings || SettingsManager.DEFAULT_SETTINGS;
    }
}

// Initialize settings manager
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
