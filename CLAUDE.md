# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Description

Gemini Bulk Image Saver is a Chrome browser extension that enables users to bulk download all images from Gemini conversations on gemini.google.com with a single click. The extension automatically organizes downloaded images by conversation, making it easy to save and manage AI-generated images from Gemini sessions.

**Chrome Web Store**: https://chromewebstore.google.com/detail/pidbeaifkcbphmlmlnglddbfackeeiah?utm_source=item-share-cb

## User Workflow

### Current Enhanced Workflow (with UI)

1. **Installation**: User installs the extension from Chrome Web Store or loads it manually
2. **Navigate to Gemini**: User visits https://gemini.google.com/ and opens any conversation
3. **Floating UI**: A floating rounded square UI appears in the right middle of the screen with:
   - **"Save Images" button**: Main clickable area with icon and text label for quick download
   - **Dropdown chevron**: Small vertical rectangle on the right for accessing options
4. **Automatic Download Process**: Click the "Save Images" button to start downloading:
   - **Dropdown auto-opens** to show real-time progress and options
   - **Progress tracking**: Live updates with success/failure counts and progress bar
   - **Smart retry system**: Automatically handles failed downloads
5. **Advanced Options**: The dropdown panel provides:
   - **Custom folder name**: Override default chat-id folder naming with helpful placeholder text
   - **Real-time progress**: Visual progress bar and statistics (✓ successful, ✗ failed)
   - **Intelligent retry**: "🔄 Retry Failed Images" button appears automatically when downloads fail
6. **Robust Download Completion**: 
   - **Automatic retry**: Up to 3 retry attempts for failed images
   - **Smart tracking**: Only retries failed images, not successful ones
   - **Complete success**: Continues until all images are downloaded or max retries reached
7. **Organized Storage**: Images are saved to `Downloads/{folder-name}/{index}.png` where:
   - `folder-name` is either custom name or sanitized Gemini conversation id
   - `index` is the sequential number of the image within that conversation

### Legacy Workflow (browser toolbar)

The original browser toolbar extension button still works as before for backward compatibility.

## Development Commands

- `npm run build` - Build the extension for Chrome and create a ZIP file
- `npm run dev` - Start development server with Chrome browser
- `npm run start` - Start the extension in Chrome browser

## Architecture

The extension follows Chrome Extension Manifest V3 architecture with two main components:

### Background Script (`background.js`)
- Handles the extension button click events (legacy functionality)
- Manages image download requests via Chrome Downloads API
- Supports custom folder names from content script
- Organizes downloaded images into folders (custom name or sanitized chat ID)
- Tracks download success/failure status and communicates back to content script
- Sanitizes folder names for filesystem compatibility

### Content Script (`contentScript.js`) 
- Auto-injected into Gemini pages via manifest content_scripts
- Creates and manages floating UI with "Save Images" button and dropdown panel
- Handles UI interactions (save button clicks, dropdown toggle, custom folder input, retry button)
- Scans conversation DOM for significant `<img>` elements while skipping small UI icons
- Sends download requests to background script with image URLs, indices, chat IDs, and custom folder names
- Tracks and displays download progress in real-time with visual progress bar
- **Smart retry system**: Tracks failed downloads and provides automatic retry functionality
- **Accessibility features**: Full ARIA labels, keyboard navigation, tooltips, and screen reader support

### File Structure
- Main scripts: `background.js`, `contentScript.js`
- Extension configuration: `manifest.json` (Manifest V3)
- TypeScript configuration: `tsconfig.json`
- Build artifacts: `dist/` directory
- Extension icons: `icons/` directory (16px, 48px, 128px)

## Key Technical Details

- Uses Chrome's `scripting` API to inject content scripts
- Requires `downloads`, `scripting`, and `activeTab` permissions
- Downloads are organized by Gemini conversation id parsed from the URL (segment after `/c/` or last path segment)
- Images are indexed sequentially within each chat folder
- Uses `conflictAction: "uniquify"` to handle filename conflicts
- **Retry mechanism**: Tracks failed downloads and automatically retries up to 3 times
- **Progress tracking**: Real-time updates with ARIA live regions for accessibility
- **Smart UI**: Dropdown auto-opens during downloads, retry button appears only when needed
- **Robust error handling**: Comprehensive failure tracking and user-friendly error messages
