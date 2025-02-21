Object.defineProperty(window, 'requestAnimationFrame', {
    value: (callback: FrameRequestCallback) => setTimeout(callback, 0)
});

beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Clear all mocks
    jest.clearAllMocks();
});
