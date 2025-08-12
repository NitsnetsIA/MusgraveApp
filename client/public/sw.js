// Service Worker for Musgrave App - Image Caching System
// Implements Cache-First strategy for offline image support

const CACHE_NAME = 'musgrave-images-v1';

// Image file extensions to intercept
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Queue for background image downloads
let imageDownloadQueue = [];
let isProcessingQueue = false;

// Install event - setup cache
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Image cache created');
      return cache;
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept image requests with Cache-First strategy
self.addEventListener('fetch', (event) => {
  // Only handle image requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_EXTENSIONS.some(ext => url.pathname.toLowerCase().includes(ext)) ||
         request.headers.get('Accept')?.includes('image/');
}

// Handle image requests with Cache-First strategy
async function handleImageRequest(request) {
  try {
    // Try cache first (Cache-First strategy)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📷 Serving image from cache:', request.url);
      return cachedResponse;
    }

    // If not in cache, fetch from network
    console.log('🌐 Fetching image from network:', request.url);
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log('💾 Image cached:', request.url);
      
      // Notify main thread about cache update
      notifyImageCached(request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Error handling image request:', error);
    // Return empty response for offline
    return new Response('', { status: 404 });
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'QUEUE_IMAGES_FOR_CACHE':
      queueImagesForBackground(data.imageUrls);
      break;
    case 'GET_CACHE_STATUS':
      sendCacheStatus();
      break;
    case 'CLEAR_IMAGE_CACHE':
      clearImageCache();
      break;
  }
});

// Queue images for background downloading
function queueImagesForBackground(imageUrls) {
  console.log(`📋 Queuing ${imageUrls.length} images for background cache`);
  
  // Add new URLs to queue (avoid duplicates)
  const newUrls = imageUrls.filter(url => !imageDownloadQueue.includes(url));
  imageDownloadQueue.push(...newUrls);
  
  // Start processing if not already running
  if (!isProcessingQueue) {
    processImageQueue();
  }
  
  // Send initial status
  sendCacheStatus();
}

// Process image download queue in background
async function processImageQueue() {
  if (isProcessingQueue || imageDownloadQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  console.log(`🔄 Starting background image cache process. Queue: ${imageDownloadQueue.length} images`);
  
  const totalImages = imageDownloadQueue.length;
  let processedImages = 0;
  
  while (imageDownloadQueue.length > 0) {
    const imageUrl = imageDownloadQueue.shift();
    
    try {
      // Check if already cached
      const cachedResponse = await caches.match(imageUrl);
      if (cachedResponse) {
        processedImages++;
        notifyProgress(processedImages, totalImages);
        continue;
      }
      
      // Download and cache image
      const response = await fetch(imageUrl);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(imageUrl, response);
        console.log(`💾 Background cached image ${processedImages + 1}/${totalImages}:`, imageUrl);
      }
      
      processedImages++;
      notifyProgress(processedImages, totalImages);
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error('❌ Error caching image in background:', imageUrl, error);
      processedImages++;
      notifyProgress(processedImages, totalImages);
    }
  }
  
  isProcessingQueue = false;
  console.log('✅ Background image caching completed');
  
  // Notify completion
  sendCacheStatus();
}

// Notify main thread about caching progress
function notifyProgress(processed, total) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'IMAGE_CACHE_PROGRESS',
        data: { processed, total }
      });
    });
  });
}

// Notify main thread about individual image cached
function notifyImageCached(imageUrl) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'IMAGE_CACHED',
        data: { imageUrl }
      });
    });
  });
}

// Send current cache status to main thread
async function sendCacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const cachedUrls = await cache.keys();
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_STATUS',
        data: {
          cachedCount: cachedUrls.length,
          queueLength: imageDownloadQueue.length,
          isProcessing: isProcessingQueue
        }
      });
    });
  });
}

// Clear image cache
async function clearImageCache() {
  try {
    await caches.delete(CACHE_NAME);
    await caches.open(CACHE_NAME); // Recreate empty cache
    imageDownloadQueue = [];
    isProcessingQueue = false;
    console.log('🗑️ Image cache cleared');
    sendCacheStatus();
  } catch (error) {
    console.error('❌ Error clearing image cache:', error);
  }
}