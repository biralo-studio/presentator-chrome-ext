// Background service worker for Chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureVisibleTab') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('Screenshot capture failed:', chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ dataUrl });
            }
        });
        return true; // Will respond asynchronously
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Presentator Screenshot Extension installed');
});