// Gemini Bulk Image Downloader - Enhanced UI Content Script

class GeminiImageSaver {
  constructor() {
    this.isDropdownOpen = false;
    this.downloadProgress = { total: 0, success: 0, failed: 0 };
    this.customFolderName = '';
    this.failedDownloads = []; // Store failed download info for retry
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.init();
  }

  init() {
    this.createFloatingUI();
    this.setupMessageListener();
  }

  createFloatingUI() {
    // Remove existing UI if present
    const existingUI = document.getElementById('gemini-image-saver-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // Get current chat ID for prefilling
    const currentChatId = this.getCurrentChatId();

    // Create main container
    const container = document.createElement('div');
    container.id = 'gemini-image-saver-ui';
    container.innerHTML = `
      <div class="gis-floating-container">
        <div class="gis-main-button" id="gis-save-btn" 
             role="button" 
             tabindex="0"
             aria-label="Save all images from Gemini conversation" 
             title="Click to download all images from this Gemini conversation">
          <svg class="gis-save-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div class="gis-button-text">
            <div class="gis-text-line1">Save</div>
            <div class="gis-text-line2">Images</div>
          </div>
        </div>
        <div class="gis-dropdown-btn" id="gis-dropdown-btn" 
             role="button" 
             tabindex="0"
             aria-label="Open download options" 
             aria-expanded="false"
             title="Click to access download options and progress tracking">
          <svg class="gis-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
        <div class="gis-dropdown-panel" id="gis-dropdown-panel" role="dialog" aria-label="Download options">
          <div class="gis-option">
            <label for="gis-folder-input">Custom folder name:</label>
            <input type="text" 
                   id="gis-folder-input" 
                   value="${currentChatId}" 
                   placeholder="Enter folder name"
                   aria-describedby="gis-folder-help"
                   title="Specify a custom name for the download folder">
            <div id="gis-folder-help" class="gis-help-text">Images will be saved to Downloads/{folder-name}/</div>
          </div>
          <div class="gis-progress" id="gis-progress" role="status" aria-live="polite">
            <button class="gis-primary-cta" id="gis-primary-cta" type="button">
              Ready to download
            </button>
            <div class="gis-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Download progress">
              <div class="gis-progress-fill"></div>
            </div>
            <div class="gis-progress-stats" aria-label="Download statistics">
              <span class="gis-success" aria-label="Successful downloads">✓ 0</span>
              <span class="gis-failed" aria-label="Failed downloads">✗ 0</span>
            </div>
          </div>
          <div class="gis-retry-section" id="gis-retry-section" style="display: none;">
            <button class="gis-retry-btn" id="gis-retry-btn" 
                    role="button" 
                    tabindex="0"
                    aria-label="Retry downloading failed images" 
                    title="Click to retry downloading the failed images">
              🔄 Retry Failed Images
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const saveBtn = document.getElementById('gis-save-btn');
    const dropdownBtn = document.getElementById('gis-dropdown-btn');
    const dropdownPanel = document.getElementById('gis-dropdown-panel');
    const folderInput = document.getElementById('gis-folder-input');

    // Initialize with current value
    this.customFolderName = folderInput.value;

    // Save button events
    saveBtn.addEventListener('click', () => this.startDownload());
    saveBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.startDownload();
      }
    });

    // Dropdown button events
    dropdownBtn.addEventListener('click', () => this.toggleDropdown());
    dropdownBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleDropdown();
      } else if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });
    
    // Close dropdown when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#gemini-image-saver-ui')) {
        this.closeDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDropdownOpen) {
        this.closeDropdown();
        dropdownBtn.focus();
      }
    });

    folderInput.addEventListener('input', (e) => {
      this.customFolderName = e.target.value.trim();
    });

    const primaryCta = document.getElementById("gis-primary-cta");
    if (primaryCta) {
      primaryCta.addEventListener("click", () => this.startDownload());
    }

    // Retry button events
    const retryBtn = document.getElementById('gis-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.retryFailedDownloads());
      retryBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.retryFailedDownloads();
        }
      });
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    const dropdownPanel = document.getElementById('gis-dropdown-panel');
    const dropdownBtn = document.getElementById('gis-dropdown-btn');
    const chevron = document.querySelector('.gis-chevron');
    
    if (this.isDropdownOpen) {
      dropdownPanel.classList.add('open');
      chevron.classList.add('open');
      dropdownBtn.setAttribute('aria-expanded', 'true');
      // Focus the first input in the dropdown for accessibility
      setTimeout(() => {
        const folderInput = document.getElementById('gis-folder-input');
        if (folderInput) folderInput.focus();
      }, 100);
    } else {
      dropdownPanel.classList.remove('open');
      chevron.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    const dropdownPanel = document.getElementById('gis-dropdown-panel');
    const dropdownBtn = document.getElementById('gis-dropdown-btn');
    const chevron = document.querySelector('.gis-chevron');
    dropdownPanel.classList.remove('open');
    chevron.classList.remove('open');
    if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');
  }

  async startDownload() {
    this.updateProgressText("Loading conversation...");
    await this.loadFullHistory();

    const images = this.findImages();
    
    if (images.length === 0) {
      this.updateProgressText('No images found');
      // Open dropdown to show the "no images" message
      if (!this.isDropdownOpen) {
        this.toggleDropdown();
      }
      return;
    }

    // Auto-open dropdown to show progress
    if (!this.isDropdownOpen) {
      this.toggleDropdown();
    }

    // Reset and initialize progress
    this.downloadProgress = { total: images.length, success: 0, failed: 0 };
    this.failedDownloads = []; // Reset failed downloads
    this.retryAttempts = 0; // Reset retry counter
    this.hideRetryButton(); // Hide retry button
    this.updateProgressText(`Downloading ${images.length} images...`);
    this.updateProgressBar();

    const folderName = this.customFolderName || this.getCurrentChatId();

    images.forEach((img, index) => {
      const downloadInfo = {
        action: "download",
        url: img.src,
        index: index,
        chatId: this.getCurrentChatId(),
        customFolder: this.customFolderName,
        folderName: folderName
      };
      
      chrome.runtime.sendMessage(downloadInfo);
    });
  }

  getCurrentChatId() {
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/").filter(Boolean);

    const conversationParam = url.searchParams.get("conversationId") || url.searchParams.get("chatId");
    if (conversationParam) return conversationParam;

    const cIndex = segments.indexOf("c");
    if (cIndex !== -1 && segments[cIndex + 1]) {
      return segments[cIndex + 1];
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment !== "app") {
      return lastSegment;
    }

    return "gemini-conversation";
  }

  findImages() {
    const scopes = [
      ...document.querySelectorAll("main"),
      ...document.querySelectorAll('[role=\"main\"]'),
      ...document.querySelectorAll('[data-message-author-role]'),
    ];

    const containers = scopes.length ? scopes : [document.body];
    const seen = new Set();
    const images = [];

    containers.forEach((container) => {
      container.querySelectorAll("img").forEach((img) => {
        const src = img.currentSrc || img.src;
        if (!src) return;
        if (src.startsWith("data:") || src.startsWith("chrome-extension:")) return;
        if (img.closest("#gemini-image-saver-ui")) return;

        const size = Math.max(img.naturalWidth, img.naturalHeight, img.width, img.height);
        if (size < 80) return; // Skip small UI icons

        if (seen.has(src)) return;
        seen.add(src);
        images.push(img);
      });
    });

    return images;
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "downloadComplete") {
        this.downloadProgress.success++;
        // Remove from failed downloads if it was previously failed and now succeeded
        this.failedDownloads = this.failedDownloads.filter(failed => 
          !(failed.url === message.url && failed.index === message.index)
        );
        this.updateProgress();
      } else if (message.action === "downloadFailed") {
        this.downloadProgress.failed++;
        
        // Store failed download info for retry
        const failedDownload = {
          url: message.url,
          index: message.index,
          error: message.error,
          chatId: this.getCurrentChatId(),
          customFolder: this.customFolderName,
          folderName: this.customFolderName || this.getCurrentChatId()
        };
        
        // Add to failed downloads if not already present
        const existingIndex = this.failedDownloads.findIndex(failed => 
          failed.url === message.url && failed.index === message.index
        );
        if (existingIndex === -1) {
          this.failedDownloads.push(failedDownload);
        }
        
        this.updateProgress();
      }
    });
  }

  updateProgress() {
    this.updateProgressBar();
    
    const completed = this.downloadProgress.success + this.downloadProgress.failed;
    if (completed === this.downloadProgress.total) {
      if (this.downloadProgress.failed > 0) {
        this.updateProgressText(`Complete! ${this.downloadProgress.success} successful, ${this.downloadProgress.failed} failed`);
        this.showRetryButton();
      } else {
        this.updateProgressText(`Complete! All ${this.downloadProgress.success} images downloaded successfully`);
        this.hideRetryButton();
      }
    } else {
      this.updateProgressText(`Downloading... ${completed}/${this.downloadProgress.total}`);
      this.hideRetryButton();
    }
  }

  updateProgressBar() {
    const completed = this.downloadProgress.success + this.downloadProgress.failed;
    const percentage = this.downloadProgress.total > 0 ? (completed / this.downloadProgress.total) * 100 : 0;
    
    const progressBar = document.querySelector('.gis-progress-bar');
    const progressFill = document.querySelector('.gis-progress-fill');
    const successSpan = document.querySelector('.gis-success');
    const failedSpan = document.querySelector('.gis-failed');
    
    if (progressBar) progressBar.setAttribute('aria-valuenow', percentage.toString());
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (successSpan) successSpan.textContent = `✓ ${this.downloadProgress.success}`;
    if (failedSpan) failedSpan.textContent = `✗ ${this.downloadProgress.failed}`;
  }

  updateProgressText(text) {
    const cta = document.getElementById('gis-primary-cta');
    if (cta) {
      cta.textContent = text;
      cta.setAttribute('aria-label', text);
    }
  }

  showRetryButton() {
    const retrySection = document.getElementById('gis-retry-section');
    if (retrySection) {
      retrySection.style.display = 'block';
    }
  }

  hideRetryButton() {
    const retrySection = document.getElementById('gis-retry-section');
    if (retrySection) {
      retrySection.style.display = 'none';
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async loadFullHistory() {
    const container = document.querySelector(".chat-history-scroll-container");
    if (!container) return;

    let lastCount = 0;
    let stable = 0;
    const maxIterations = 40;
    const settleThreshold = 3;

    for (let i = 0; i < maxIterations && stable < settleThreshold; i++) {
      const conversations = container.querySelectorAll(".conversation-container");
      if (!conversations.length) break;

      const target = conversations[0] || container;
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      } else {
        container.scrollTo({ top: 0, behavior: "auto" });
      }

      await this.sleep(600);

      const newCount = container.querySelectorAll(".conversation-container").length;
      if (newCount <= lastCount) {
        stable += 1;
      } else {
        stable = 0;
        lastCount = newCount;
      }
    }

    container.scrollTo({ top: 0, behavior: "auto" });
    await this.sleep(150);
  }

  retryFailedDownloads() {
    if (this.failedDownloads.length === 0) {
      this.updateProgressText('No failed downloads to retry');
      return;
    }

    // Check if we've exceeded max retry attempts
    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.updateProgressText(`Max retry attempts (${this.maxRetryAttempts}) reached. ${this.failedDownloads.length} images still failed.`);
      return;
    }

    this.retryAttempts++;
    this.hideRetryButton();
    
    // Reset only the failed count for the retry
    const failedCount = this.failedDownloads.length;
    this.downloadProgress.failed = 0;
    
    this.updateProgressText(`Retry attempt ${this.retryAttempts}/${this.maxRetryAttempts}: Retrying ${failedCount} failed images...`);
    this.updateProgressBar();

    // Make a copy of failed downloads since the array may be modified during retry
    const failedToRetry = [...this.failedDownloads];
    this.failedDownloads = []; // Clear the array, it will be repopulated if downloads fail again

    // Retry each failed download
    failedToRetry.forEach((failedDownload) => {
      const downloadInfo = {
        action: "download",
        url: failedDownload.url,
        index: failedDownload.index,
        chatId: failedDownload.chatId,
        customFolder: failedDownload.customFolder,
        folderName: failedDownload.folderName
      };
      
      chrome.runtime.sendMessage(downloadInfo);
    });
  }
}

// Initialize the image saver when content script loads
const geminiImageSaver = new GeminiImageSaver();
