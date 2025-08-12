// Image Cache Monitoring Service
// Monitors Service Worker progress and handles stalled downloads

export class ImageCacheMonitor {
  private lastProgressUpdate: number = 0;
  private progressCheckInterval?: NodeJS.Timeout;
  private stallTimeout = 30000; // 30 seconds
  
  startMonitoring() {
    this.lastProgressUpdate = Date.now();
    
    // Check for stalled progress every 10 seconds
    this.progressCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - this.lastProgressUpdate;
      
      if (timeSinceLastUpdate > this.stallTimeout) {
        console.warn('⚠️ Image caching appears stalled, attempting recovery...');
        this.handleStalledProgress();
      }
    }, 10000);
  }
  
  stopMonitoring() {
    if (this.progressCheckInterval) {
      clearInterval(this.progressCheckInterval);
      this.progressCheckInterval = undefined;
    }
  }
  
  updateProgress() {
    this.lastProgressUpdate = Date.now();
  }
  
  private async handleStalledProgress() {
    try {
      // Send message to Service Worker to check status
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_QUEUE_STATUS'
        });
      }
    } catch (error) {
      console.error('Error handling stalled progress:', error);
    }
  }
}

export const imageCacheMonitor = new ImageCacheMonitor();