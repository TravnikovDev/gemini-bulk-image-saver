// Gemini Bulk Image Downloader - Enhanced Background Script

// Legacy functionality: Handle extension button clicks (for backward compatibility)
chrome.action.onClicked.addListener((tab) => {
  console.log("Pressed the extension button");
  console.log(tab);
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["contentScript.js"],
    });
  }
});

// Enhanced message handling with progress tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "download" && message.url) {
    console.log("Downloading image", message.url, "to folder:", message.folderName);
    
    // Use custom folder name if provided, otherwise fall back to sanitized chat ID
    const folderName = message.folderName ? 
      sanitizeFilename(message.folderName) : 
      sanitizeFilename(message.chatId);
    
    const filename = `${folderName}/${message.index}.png`;

    chrome.downloads.download({
      url: message.url,
      filename: filename,
      conflictAction: "uniquify",
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError);
        // Notify content script of failure
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "downloadFailed",
            url: message.url,
            index: message.index,
            error: chrome.runtime.lastError.message
          });
        }
      } else {
        console.log("Download started with ID:", downloadId);
        // Monitor download completion
        if (downloadId && sender.tab && sender.tab.id) {
          monitorDownload(downloadId, sender.tab.id, message.url, message.index);
        }
      }
    });
  }
});

// Monitor individual download progress
function monitorDownload(downloadId, tabId, url, index) {
  const checkDownload = () => {
    chrome.downloads.search({ id: downloadId }, (results) => {
      if (results && results.length > 0) {
        const download = results[0];
        
        if (download.state === 'complete') {
          console.log(`Download completed: ${url}`);
          chrome.tabs.sendMessage(tabId, {
            action: "downloadComplete",
            url: url,
            index: index,
            downloadId: downloadId
          });
        } else if (download.state === 'interrupted') {
          console.error(`Download failed: ${url}`, download.error);
          chrome.tabs.sendMessage(tabId, {
            action: "downloadFailed",
            url: url,
            index: index,
            error: download.error || 'Download interrupted',
            downloadId: downloadId
          });
        } else {
          // Still in progress, check again
          setTimeout(checkDownload, 500);
        }
      }
    });
  };
  
  // Start monitoring
  setTimeout(checkDownload, 100);
}

// Sanitize filename to be safe for filesystem
function sanitizeFilename(name) {
  if (!name) return 'unknown';
  
  // Replace any characters that are not allowed in filenames
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // Windows forbidden characters
    .replace(/[^\w\s-_.]/g, '_')    // Keep only alphanumeric, spaces, hyphens, underscores, dots
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/_+/g, '_')            // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')        // Remove leading/trailing underscores
    .substring(0, 100)              // Limit length to prevent filesystem issues
    || 'unknown';                   // Fallback if empty after sanitization
}
