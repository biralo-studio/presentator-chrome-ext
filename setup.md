# Presentator Chrome Extension Setup

## Project Structure
```
presentator-chrome-ext/
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup UI
├── popup.js               # Main popup logic and API client
├── content.js             # Content script for full-page screenshots
├── background.js          # Service worker
├── icons/                 # Extension icons (create these)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── create-icons.py        # Script to generate icons
└── setup.md              # This setup file
```

## Features
- 🔐 Login/logout to your Presentator instance
- 📋 Select project and prototype from dropdowns
- 📸 Capture viewport or full-page screenshots
- ⬆️ Upload screenshots directly to Presentator
- 💾 Remember login credentials

## Setup Instructions

### 1. Create Icons
You need to create icon files for the extension. You have several options:

**Option A: Use the Python script (recommended)**
```bash
pip install Pillow
python3 create-icons.py
```

**Option B: Use the SVG file**
1. Open `icons/icon.svg` in any image editor
2. Export as PNG in sizes: 16x16, 32x32, 48x48, 128x128
3. Save as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` in the `icons/` folder

**Option C: Use placeholder images**
Create simple colored squares as temporary icons:
- 16x16 pixel PNG files in blue color (#007cba)
- Name them: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `presentator-chrome-ext` folder
5. The extension icon should appear in your extensions bar

### 3. Configure Your Presentator Instance

Make sure your Presentator instance:
- Is running and accessible via HTTPS (required for the extension)
- Has CORS configured to allow requests from `chrome-extension://`
- Has the following collections available:
  - `users` (for authentication)
  - `projects` (for project listing)
  - `prototypes` (for prototype listing)  
  - `screens` (for screenshot uploads)

### 4. Using the Extension

1. Click the extension icon in your browser
2. Enter your Presentator server URL (e.g., `https://your-presentator.com`)
3. Login with your email and password
4. Select a project and prototype
5. Choose capture type (viewport or full page)
6. Click "Capture & Upload Screenshot"

## API Endpoints Used

The extension uses these PocketBase API endpoints:

- `POST /api/collections/users/auth-with-password` - Authentication
- `GET /api/collections/projects/records` - List projects
- `GET /api/collections/prototypes/records?filter=(project="ID")` - List prototypes
- `POST /api/collections/screens/records` - Upload screenshot

## Troubleshooting

### Login Issues
- Verify your server URL is correct and accessible
- Check that your Presentator instance is running
- Ensure CORS is properly configured

### Screenshot Issues
- Make sure the extension has "activeTab" permission
- For full-page capture, the content script must be injected properly
- Some pages may block screenshot capture for security reasons

### Upload Issues
- Check that your Presentator instance accepts file uploads
- Verify the screens collection exists and is properly configured
- Check browser console for detailed error messages

## Development Notes

- The extension uses Manifest V3
- Storage is handled via `chrome.storage.local`
- Screenshot capture uses `chrome.tabs.captureVisibleTab`
- Full-page capture is implemented via content script
- All API calls are made directly to your Presentator instance

## Security Considerations

- Credentials are stored locally in the extension
- The extension requests access to all websites for screenshot capture
- File uploads are sent directly to your Presentator instance
- No data is sent to third-party services