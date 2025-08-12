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
    <div className={`flex flex-col items-center text-xs ${className}`}>
      {/* Progress text in Musgrave green - smaller font */}
      <span className="text-musgrave-500 font-medium leading-tight">
        Descargando
      </span>
      <span className="text-musgrave-500 font-medium leading-tight">
        Imágenes
      </span>
      <span className="text-musgrave-500 font-bold leading-tight">
        {processed.toLocaleString()}/{total.toLocaleString()}
      </span>
    </div>
  );
};

export default ImageCacheIndicator;