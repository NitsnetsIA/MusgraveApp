// Image Cache Service - Interface between app and Service Worker
// Manages background image caching and progress tracking

export interface ImageCacheStatus {
  cachedCount: number;
  queueLength: number;
  isProcessing: boolean;
}

export interface ImageCacheProgress {
  processed: number;
  total: number;
}

export type ImageCacheListener = (progress: ImageCacheProgress) => void;
export type CacheStatusListener = (status: ImageCacheStatus) => void;

class ImageCacheService {
  private progressListeners: Set<ImageCacheListener> = new Set();
  private statusListeners: Set<CacheStatusListener> = new Set();
  private serviceWorkerReady = false;

  constructor() {
    this.initServiceWorker();
    this.setupMessageListener();
  }

  // Initialize Service Worker
  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered for image caching');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        this.serviceWorkerReady = true;
        
        console.log('🚀 Service Worker ready for image caching');
        
        // Request initial cache status
        this.requestCacheStatus();
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Worker not supported');
    }
  }

  // Setup message listener for Service Worker communication
  private setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'IMAGE_CACHE_PROGRESS':
            this.notifyProgressListeners(data);
            break;
          case 'CACHE_STATUS':
            this.notifyStatusListeners(data);
            break;
          case 'IMAGE_CACHED':
            // Individual image cached - could be used for specific UI updates
            console.log('📷 Image cached:', data.imageUrl);
            break;
        }
      });
    }
  }

  // Queue images for background caching
  async queueImagesForCache(imageUrls: string[]): Promise<void> {
    if (!this.serviceWorkerReady) {
      console.warn('⚠️ Service Worker not ready, queuing images locally');
      return;
    }

    if (!navigator.serviceWorker.controller) {
      console.warn('⚠️ No active Service Worker controller');
      return;
    }

    // Filter out invalid URLs
    const validUrls = imageUrls.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      console.log('📋 No valid image URLs to queue');
      return;
    }

    console.log(`📋 Queuing ${validUrls.length} images for background caching`);
    
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_IMAGES_FOR_CACHE',
      data: { imageUrls: validUrls }
    });
  }

  // Request current cache status
  requestCacheStatus(): void {
    if (!this.serviceWorkerReady || !navigator.serviceWorker.controller) {
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'GET_CACHE_STATUS'
    });
  }

  // Resume stalled queue processing
  async resumeStalled(): Promise<void> {
    if (!this.serviceWorkerReady || !navigator.serviceWorker.controller) {
      console.warn('⚠️ Service Worker not ready for resume command');
      return;
    }

    console.log('🔄 Manually resuming stalled image caching...');
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_QUEUE_STATUS'
    });
  }

  // Get count of cached images
  async getCachedImageCount(): Promise<number> {
    if (!this.serviceWorkerReady) {
      return 0;
    }

    try {
      const cache = await caches.open('musgrave-images-v1');
      const cachedRequests = await cache.keys();
      return cachedRequests.length;
    } catch (error) {
      console.warn('Error getting cached image count:', error);
      return 0;
    }
  }

  // Clear image cache
  async clearImageCache(): Promise<void> {
    if (!this.serviceWorkerReady || !navigator.serviceWorker.controller) {
      console.warn('⚠️ Service Worker not ready');
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_IMAGE_CACHE'
    });
  }

  // Add progress listener
  addProgressListener(listener: ImageCacheListener): void {
    this.progressListeners.add(listener);
  }

  // Remove progress listener
  removeProgressListener(listener: ImageCacheListener): void {
    this.progressListeners.delete(listener);
  }

  // Add status listener
  addStatusListener(listener: CacheStatusListener): void {
    this.statusListeners.add(listener);
  }

  // Remove status listener
  removeStatusListener(listener: CacheStatusListener): void {
    this.statusListeners.delete(listener);
  }

  // Notify progress listeners
  private notifyProgressListeners(progress: ImageCacheProgress): void {
    this.progressListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('❌ Error in progress listener:', error);
      }
    });
  }

  // Notify status listeners
  private notifyStatusListeners(status: ImageCacheStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('❌ Error in status listener:', error);
      }
    });
  }

  // Extract image URLs from products
  static extractImageUrls(products: any[]): string[] {
    return products
      .map(product => product.image_url)
      .filter(url => url && typeof url === 'string' && url.trim() !== '');
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ size: number; urls: string[] } | null> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('musgrave-images-v1');
        const requests = await cache.keys();
        return {
          size: requests.length,
          urls: requests.map(req => req.url)
        };
      }
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
    }
    return null;
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();