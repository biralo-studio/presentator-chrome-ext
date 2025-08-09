class PresentatorAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.authToken = null;
        this.user = null;
    }

    async authenticate(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/api/collections/users/auth-with-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identity: email,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Authentication failed');
            }

            const data = await response.json();
            this.authToken = data.token;
            this.user = data.record;
            
            return { success: true, user: this.user, token: this.authToken };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProjects() {
        try {
            const response = await fetch(`${this.baseUrl}/api/collections/projects/records`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            return { success: true, projects: data.items || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getPrototypes(projectId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/collections/prototypes/records?filter=(project="${projectId}")`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch prototypes');
            }

            const data = await response.json();
            return { success: true, prototypes: data.items || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async uploadScreen(prototypeId, file, title) {
        try {
            const formData = new FormData();
            formData.append('prototype', prototypeId);
            formData.append('file', file);
            formData.append('title', title);

            const response = await fetch(`${this.baseUrl}/api/collections/screens/records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload screen');
            }

            const data = await response.json();
            return { success: true, screen: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

class PresentatorExtension {
    constructor() {
        this.api = null;
        this.init();
    }

    async init() {
        await this.loadStoredData();
        this.bindEvents();
        this.updateUI();
    }

    async loadStoredData() {
        const result = await chrome.storage.local.get(['serverUrl', 'authToken', 'user']);
        if (result.serverUrl && result.authToken && result.user) {
            this.api = new PresentatorAPI(result.serverUrl);
            this.api.authToken = result.authToken;
            this.api.user = result.user;
        }
    }

    async saveAuthData() {
        await chrome.storage.local.set({
            serverUrl: this.api.baseUrl,
            authToken: this.api.authToken,
            user: this.api.user
        });
    }

    async clearAuthData() {
        await chrome.storage.local.clear();
        this.api = null;
    }

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('projectSelect').addEventListener('change', () => this.handleProjectChange());
        document.getElementById('captureBtn').addEventListener('click', () => this.handleCapture());
        
        // Enable form submission on Enter
        ['serverUrl', 'email', 'password'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        });
    }

    updateUI() {
        const loginSection = document.getElementById('loginSection');
        const mainSection = document.getElementById('mainSection');
        
        if (this.api && this.api.authToken) {
            loginSection.classList.add('hidden');
            mainSection.classList.remove('hidden');
            
            document.getElementById('userEmail').textContent = this.api.user.email;
            document.getElementById('currentServer').textContent = this.api.baseUrl;
            
            this.loadProjects();
        } else {
            loginSection.classList.remove('hidden');
            mainSection.classList.add('hidden');
        }
    }

    async handleLogin() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!serverUrl || !email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        this.showStatus('Logging in...', 'info');
        document.getElementById('loginBtn').disabled = true;

        this.api = new PresentatorAPI(serverUrl);
        const result = await this.api.authenticate(email, password);

        if (result.success) {
            await this.saveAuthData();
            this.showStatus('Logged in successfully!', 'success');
            this.updateUI();
        } else {
            this.showStatus(`Login failed: ${result.error}`, 'error');
        }

        document.getElementById('loginBtn').disabled = false;
    }

    async handleLogout() {
        await this.clearAuthData();
        this.updateUI();
        this.showStatus('Logged out successfully', 'info');
    }

    async loadProjects() {
        const projectSelect = document.getElementById('projectSelect');
        const prototypeSelect = document.getElementById('prototypeSelect');
        
        projectSelect.innerHTML = '<option value="">Loading projects...</option>';
        projectSelect.disabled = true;
        prototypeSelect.innerHTML = '<option value="">Select a project first</option>';
        prototypeSelect.disabled = true;
        document.getElementById('captureBtn').disabled = true;

        const result = await this.api.getProjects();
        
        if (result.success) {
            projectSelect.innerHTML = '<option value="">Select a project</option>';
            result.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.title || project.name || 'Untitled Project';
                projectSelect.appendChild(option);
            });
            projectSelect.disabled = false;
        } else {
            projectSelect.innerHTML = '<option value="">Failed to load projects</option>';
            this.showStatus(`Failed to load projects: ${result.error}`, 'error');
        }
    }

    async handleProjectChange() {
        const projectSelect = document.getElementById('projectSelect');
        const prototypeSelect = document.getElementById('prototypeSelect');
        const projectId = projectSelect.value;

        prototypeSelect.innerHTML = '<option value="">Select a prototype</option>';
        prototypeSelect.disabled = true;
        document.getElementById('captureBtn').disabled = true;

        if (!projectId) {
            prototypeSelect.innerHTML = '<option value="">Select a project first</option>';
            return;
        }

        prototypeSelect.innerHTML = '<option value="">Loading prototypes...</option>';
        
        const result = await this.api.getPrototypes(projectId);
        
        if (result.success) {
            prototypeSelect.innerHTML = '<option value="">Select a prototype</option>';
            result.prototypes.forEach(prototype => {
                const option = document.createElement('option');
                option.value = prototype.id;
                option.textContent = prototype.title || prototype.name || 'Untitled Prototype';
                prototypeSelect.appendChild(option);
            });
            prototypeSelect.disabled = false;
            
            // Enable capture button when prototype is selected
            prototypeSelect.addEventListener('change', () => {
                document.getElementById('captureBtn').disabled = !prototypeSelect.value;
            });
        } else {
            prototypeSelect.innerHTML = '<option value="">Failed to load prototypes</option>';
            this.showStatus(`Failed to load prototypes: ${result.error}`, 'error');
        }
    }

    async handleCapture() {
        const prototypeSelect = document.getElementById('prototypeSelect');
        const prototypeId = prototypeSelect.value;
        const captureType = document.querySelector('input[name="captureType"]:checked').value;

        if (!prototypeId) {
            this.showStatus('Please select a prototype first', 'error');
            return;
        }

        this.showStatus('Capturing screenshot...', 'info');
        document.getElementById('captureBtn').disabled = true;

        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            let finalDataUrl;
            
            if (captureType === 'viewport') {
                // Simple viewport capture
                finalDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
            } else {
                // Full page capture
                finalDataUrl = await this.captureFullPage(tab.id);
            }

            // Convert data URL to blob
            const response = await fetch(finalDataUrl);
            const blob = await response.blob();
            
            // Create file object
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const title = `Screenshot-${timestamp}`;
            const file = new File([blob], `${title}.png`, { type: 'image/png' });

            this.showStatus('Uploading screenshot...', 'info');
            
            // Upload to Presentator
            const uploadResult = await this.api.uploadScreen(prototypeId, file, title);
            
            if (uploadResult.success) {
                this.showStatus('Screenshot uploaded successfully!', 'success');
                
                // Auto-open new tab with uploaded screen
                const screen = uploadResult.screen;
                const projectSelect = document.getElementById('projectSelect');
                const selectedProject = projectSelect.options[projectSelect.selectedIndex];
                const projectId = selectedProject.value;
                
                // Construct URL to view the uploaded screen in Presentator
                const screenUrl = `${this.api.baseUrl}/#/projects/${projectId}/prototypes/${prototypeId}/screens/${screen.id}?mode=comments&fit=0`;
                
                // Open new tab
                chrome.tabs.create({ url: screenUrl });
            } else {
                this.showStatus(`Upload failed: ${uploadResult.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Capture failed: ${error.message}`, 'error');
        }

        document.getElementById('captureBtn').disabled = false;
    }

    async captureFullPage(tabId) {
        try {
            // Get page dimensions from content script
            const dimensions = await chrome.tabs.sendMessage(tabId, { action: 'getPageDimensions' });
            
            const {
                pageWidth,
                pageHeight,
                viewportWidth,
                viewportHeight,
                originalScrollX,
                originalScrollY
            } = dimensions;

            // If the page fits in the viewport, just capture it normally
            if (pageHeight <= viewportHeight && pageWidth <= viewportWidth) {
                return await chrome.tabs.captureVisibleTab(null, { format: 'png' });
            }

            // Create canvas for stitching screenshots
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = pageWidth;
            canvas.height = pageHeight;

            // Calculate how many screenshots we need
            const numCols = Math.ceil(pageWidth / viewportWidth);
            const numRows = Math.ceil(pageHeight / viewportHeight);

            // Capture screenshots in a grid pattern
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    const scrollX = col * viewportWidth;
                    const scrollY = row * viewportHeight;

                    // Scroll to position
                    await chrome.tabs.sendMessage(tabId, {
                        action: 'scrollToPosition',
                        x: scrollX,
                        y: scrollY
                    });

                    // Wait for scroll to complete
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // Capture screenshot
                    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                    
                    // Draw on canvas
                    await new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            // Calculate the actual dimensions to draw (handle edge cases)
                            const drawWidth = Math.min(viewportWidth, pageWidth - scrollX);
                            const drawHeight = Math.min(viewportHeight, pageHeight - scrollY);
                            
                            ctx.drawImage(
                                img,
                                0, 0, drawWidth, drawHeight, // source rectangle
                                scrollX, scrollY, drawWidth, drawHeight // destination rectangle
                            );
                            resolve();
                        };
                        img.src = screenshotDataUrl;
                    });
                }
            }

            // Restore original scroll position
            await chrome.tabs.sendMessage(tabId, {
                action: 'restoreScroll',
                x: originalScrollX,
                y: originalScrollY
            });

            // Return the stitched image as data URL
            return canvas.toDataURL('image/png');

        } catch (error) {
            console.error('Full page capture error:', error);
            // Fallback to viewport capture
            return await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        }
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                status.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new PresentatorExtension();
});