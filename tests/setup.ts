import { chrome } from 'jest-chrome';

// Mock chrome.storage API
chrome.storage.sync.get.mockImplementation(() => Promise.resolve({}));
chrome.storage.sync.set.mockImplementation(() => Promise.resolve());
chrome.storage.local.get.mockImplementation(() => Promise.resolve({}));
chrome.storage.local.set.mockImplementation(() => Promise.resolve());
chrome.storage.local.clear.mockImplementation(() => Promise.resolve());
chrome.storage.sync.clear.mockImplementation(() => Promise.resolve());

// Mock chrome.runtime API
chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve());

// Mock chrome API in global scope
(global as any).chrome = chrome;

// Create mock functions for listeners
const messageListener = jest.fn();
const installedListener = jest.fn();

// Mock the chrome.runtime.onMessage object
const onMessage = {
    addListener: messageListener,
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn()
};

// Mock the chrome.runtime.onInstalled object
const onInstalled = {
    addListener: installedListener,
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn()
};

// Add mock property to the objects
Object.defineProperty(onMessage, 'mock', {
    get: () => messageListener.mock,
    configurable: true
});

Object.defineProperty(onInstalled, 'mock', {
    get: () => installedListener.mock,
    configurable: true
});

// Assign the mocked objects to chrome.runtime
Object.defineProperty(chrome.runtime, 'onMessage', {
    value: onMessage,
    writable: true,
    configurable: true
});

Object.defineProperty(chrome.runtime, 'onInstalled', {
    value: onInstalled,
    writable: true,
    configurable: true
});

// Clear all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
