import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';

declare global {
    namespace NodeJS {
        interface Global {
            chrome: typeof chrome;
        }
    }
}

(global as any).chrome = chrome;

Object.defineProperty(window, 'requestAnimationFrame', {
    value: (callback: FrameRequestCallback) => setTimeout(callback, 0)
});

beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Clear all mocks before each test
    jest.clearAllMocks();
});
