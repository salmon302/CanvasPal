export interface StorageData {
    icalUrl: string;
    weights: {
        dueDate: number;
        gradeWeight: number;
        impact: number;
    };
}

export interface ChromeMessage {
    type: string;
    data?: any;
}

export type MessageCallback = (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) => void | boolean;
