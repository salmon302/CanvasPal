import { Assignment } from "../utils/priorityCalculator";

interface Settings {
    icalUrl?: string;
    weights?: {
        dueDate: number;
        gradeWeight: number;
        impact: number;
    };
}

export class PopupManager {
    private urlInput: HTMLInputElement;
    private dueDateWeight: HTMLInputElement;
    private gradeWeight: HTMLInputElement;
    private impactWeight: HTMLInputElement;
    private assignmentsList: HTMLElement;
    private syncStatus: HTMLElement;
    private errorMessage: HTMLElement;

    constructor() {
        this.urlInput = document.getElementById("ical-url") as HTMLInputElement;
        this.dueDateWeight = document.getElementById("due-date-weight") as HTMLInputElement;
        this.gradeWeight = document.getElementById("grade-weight") as HTMLInputElement;
        this.impactWeight = document.getElementById("impact-weight") as HTMLInputElement;
        this.assignmentsList = document.getElementById("assignments-list") as HTMLElement;
        this.syncStatus = document.getElementById("sync-status") as HTMLElement;
        this.errorMessage = document.getElementById("error-message") as HTMLElement;

        this.initializeListeners();
        this.loadSettings();
        this.fetchAssignments();

        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    private async loadSettings(): Promise<void> {
        const settings = await chrome.storage.sync.get(["icalUrl", "weights"]) as Settings;
        if (settings.icalUrl) {
            this.urlInput.value = settings.icalUrl;
        }
        if (settings.weights) {
            this.dueDateWeight.value = settings.weights.dueDate.toString();
            this.gradeWeight.value = settings.weights.gradeWeight.toString();
            this.impactWeight.value = settings.weights.impact.toString();
        }
    }

    private initializeListeners(): void {
        this.urlInput.addEventListener("change", () => {
            chrome.storage.sync.set({ icalUrl: this.urlInput.value });
        });

        document.getElementById("sync-button")?.addEventListener("click", () => {
            chrome.runtime.sendMessage({ type: "forceSync" });
        });

        [this.dueDateWeight, this.gradeWeight, this.impactWeight].forEach(slider => {
            slider.addEventListener("input", () => {
                chrome.storage.sync.set({
                    weights: {
                        dueDate: parseInt(this.dueDateWeight.value),
                        gradeWeight: parseInt(this.gradeWeight.value),
                        impact: parseInt(this.impactWeight.value)
                    }
                });
            });
        });
    }

    private async fetchAssignments(): Promise<void> {
        try {
            const assignments = await chrome.runtime.sendMessage({ type: "fetchAssignments" }) as Assignment[];
            this.displayAssignments(assignments);
        } catch (error) {
            this.errorMessage.textContent = "Failed to fetch assignments";
        }
    }

    private displayAssignments(assignments: Assignment[]): void {
        this.assignmentsList.innerHTML = assignments.map(assignment => `
            <div class="assignment">
                <label class="completion-toggle">
                    <input type="checkbox" 
                           ${assignment.completed ? "checked" : ""} 
                           data-title="${assignment.title}">
                    ${assignment.title}
                </label>
                <div class="details">
                    Due: ${assignment.dueDate.toLocaleDateString()}
                    ${assignment.gradeWeight ? `Weight: ${assignment.gradeWeight}%` : ""}
                </div>
            </div>
        `).join("");

        this.assignmentsList.querySelectorAll(".completion-toggle input").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const title = (e.target as HTMLInputElement).dataset.title;
                if (title) {
                    chrome.storage.local.set({ [`assignment_${title}`]: (e.target as HTMLInputElement).checked });
                }
            });
        });
    }

    private handleMessage(message: { type: string; timestamp?: number }): void {
        if (message.type === "syncComplete" && message.timestamp) {
            this.syncStatus.textContent = `Last synced: ${new Date(message.timestamp).toLocaleTimeString()}`;
        }
    }
}

export const popupManager = new PopupManager();
