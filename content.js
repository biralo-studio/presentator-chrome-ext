// Content script for full page screenshot capture
(function() {
    'use strict';

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'captureFullPage') {
            captureFullPage().then(dataUrl => {
                sendResponse({ dataUrl });
            }).catch(error => {
                console.error('Full page capture error:', error);
                sendResponse({ error: error.message });
            });
            return true; // Will respond asynchronously
        }
    });

    async function captureFullPage() {
        return new Promise((resolve, reject) => {
            try {
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

                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = pageWidth;
                canvas.height = pageHeight;

                // Calculate number of screenshots needed
                const numScreensX = Math.ceil(pageWidth / viewportWidth);
                const numScreensY = Math.ceil(pageHeight / viewportHeight);

                let capturedScreens = 0;
                const totalScreens = numScreensX * numScreensY;

                // Function to capture individual screenshot
                function captureScreen(x, y, callback) {
                    window.scrollTo(x * viewportWidth, y * viewportHeight);
                    
                    // Wait for scroll to complete and any dynamic content to load
                    setTimeout(() => {
                        // Use html2canvas if available, otherwise fallback to basic method
                        if (typeof html2canvas !== 'undefined') {
                            html2canvas(document.body, {
                                x: x * viewportWidth,
                                y: y * viewportHeight,
                                width: Math.min(viewportWidth, pageWidth - x * viewportWidth),
                                height: Math.min(viewportHeight, pageHeight - y * viewportHeight),
                                useCORS: true,
                                allowTaint: true
                            }).then(screenCanvas => {
                                ctx.drawImage(screenCanvas, x * viewportWidth, y * viewportHeight);
                                callback();
                            }).catch(error => {
                                console.warn('html2canvas failed, using fallback method:', error);
                                callback();
                            });
                        } else {
                            // Fallback: request screenshot from background script
                            chrome.runtime.sendMessage(
                                { action: 'captureVisibleTab' },
                                (response) => {
                                    if (response && response.dataUrl) {
                                        const img = new Image();
                                        img.onload = () => {
                                            ctx.drawImage(img, x * viewportWidth, y * viewportHeight);
                                            callback();
                                        };
                                        img.src = response.dataUrl;
                                    } else {
                                        callback();
                                    }
                                }
                            );
                        }
                    }, 100);
                }

                // Capture all screens
                function captureNext(x, y) {
                    if (y >= numScreensY) {
                        // All screens captured, restore scroll position
                        window.scrollTo(originalScrollX, originalScrollY);
                        
                        // Convert canvas to data URL
                        const dataUrl = canvas.toDataURL('image/png');
                        resolve(dataUrl);
                        return;
                    }

                    captureScreen(x, y, () => {
                        capturedScreens++;
                        
                        let nextX = x + 1;
                        let nextY = y;
                        
                        if (nextX >= numScreensX) {
                            nextX = 0;
                            nextY++;
                        }
                        
                        setTimeout(() => captureNext(nextX, nextY), 50);
                    });
                }

                // Start capturing from top-left
                captureNext(0, 0);

            } catch (error) {
                reject(error);
            }
        });
    }

})();