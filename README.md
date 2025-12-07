# Gemini Bulk Image Saver

Chrome extension to bulk download images from Gemini conversations on `https://gemini.google.com/`. It injects a floating UI that collects all conversation images and saves them into a named folder under your Downloads directory.

## Features
- One-click bulk save of conversation images
- Custom folder naming per conversation
- Progress + retry for failed downloads
- Works on `https://gemini.google.com/*`

## Quick Start (dev)
1. Install deps: `npm install`
2. Build: `npm run build` (creates a zip in `dist/`)
3. Load unpacked in Chrome: `chrome://extensions` → enable Developer Mode → Load unpacked → select the repo folder.

## Manual test flow
1. Open `https://gemini.google.com/`
2. Start or open a conversation with images
3. Use the floating “Save Images” button to download; watch progress and retry failed items if shown.

## Scripts
- `npm run build` – bundle the extension and zip it
- `npm run dev` – dev server for live reload
- `npm run start` – start the extension in Chrome

## Notes
- Permissions: `downloads`, `scripting`, `activeTab`
- Images are saved to `Downloads/{custom-or-parsed-id}/{index}.png`
- Icons are placeholder copies from the previous project; swap with Gemini-themed assets when ready.

## License
MIT
