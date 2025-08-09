// Content script for full page screenshot capture
(function() {
    'use strict';

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getPageDimensions') {
            const dimensions = getPageDimensions();
            sendResponse(dimensions);
            return true;
        }
        
        if (request.action === 'scrollToPosition') {
            scrollToPosition(request.x, request.y);
            sendResponse({ success: true });
            return true;
        }
        
        if (request.action === 'restoreScroll') {
            window.scrollTo(request.x, request.y);
            sendResponse({ success: true });
            return true;
        }
    });

    function getPageDimensions() {
        // Get original scroll position
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        
        // Get page dimensions
        const pageWidth = Math.max(
            document.body.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.clientWidth,
            document.documentElement.scrollWidth,
            document.documentElement.offsetWidth
        );
        
        const pageHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        return {
            pageWidth,
            pageHeight,
            viewportWidth,
            viewportHeight,
            originalScrollX,
            originalScrollY
        };
    }

    function scrollToPosition(x, y) {
        window.scrollTo(x, y);
    }

})();