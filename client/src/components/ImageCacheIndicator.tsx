import React, { useState, useEffect } from 'react';
import { imageCacheService, ImageCacheProgress, ImageCacheStatus } from '@/lib/image-cache-service';

interface ImageCacheIndicatorProps {
  className?: string;
}

export const ImageCacheIndicator: React.FC<ImageCacheIndicatorProps> = ({ 
  className = '' 
}) => {
  const [progress, setProgress] = useState<ImageCacheProgress | null>(null);
  const [status, setStatus] = useState<ImageCacheStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Progress listener
    const handleProgress = (newProgress: ImageCacheProgress) => {
      setProgress(newProgress);
      setIsVisible(newProgress.total > 0 && newProgress.processed < newProgress.total);
    };

    // Status listener
    const handleStatus = (newStatus: ImageCacheStatus) => {
      setStatus(newStatus);
      setIsVisible(newStatus.queueLength > 0 || newStatus.isProcessing);
    };

    // Add listeners
    imageCacheService.addProgressListener(handleProgress);
    imageCacheService.addStatusListener(handleStatus);

    // Request initial status
    imageCacheService.requestCacheStatus();

    // Cleanup listeners on unmount
    return () => {
      imageCacheService.removeProgressListener(handleProgress);
      imageCacheService.removeStatusListener(handleStatus);
    };
  }, []);

  // Don't render if not visible or no progress data
  if (!isVisible || (!progress && !status)) {
    return null;
  }

  // Calculate display values
  const processed = progress?.processed || 0;
  const total = progress?.total || status?.queueLength || 0;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {/* Orange spinning icon to indicate active caching */}
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
      
      {/* Progress text in orange */}
      <span className="text-orange-500 font-medium">
        {processed.toLocaleString()}/{total.toLocaleString()} Imágenes sincronizadas
      </span>
      
      {/* Optional percentage */}
      {percentage > 0 && (
        <span className="text-orange-400 text-xs">
          ({percentage}%)
        </span>
      )}
    </div>
  );
};

export default ImageCacheIndicator;