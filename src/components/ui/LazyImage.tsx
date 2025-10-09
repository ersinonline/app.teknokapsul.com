import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from './SkeletonLoader';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  width,
  height,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {!isInView && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          className="absolute inset-0"
        />
      )}
      
      {isInView && !hasError && (
        <>
          {!isLoaded && (
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              className="absolute inset-0"
              animation="wave"
            />
          )}
          
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`
              transition-opacity duration-300 
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${className}
            `}
            style={containerStyle}
          />
        </>
      )}
      
      {hasError && placeholder && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
          <img
            src={placeholder}
            alt={alt}
            className={`opacity-50 ${className}`}
            style={containerStyle}
          />
        </div>
      )}
      
      {hasError && !placeholder && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 text-gray-400">
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Progressive image loading component
interface ProgressiveImageProps {
  src: string;
  lowQualitySrc?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  lowQualitySrc,
  alt,
  className = '',
  width,
  height
}) => {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={containerStyle}>
      {/* Skeleton loader */}
      {!isLowQualityLoaded && !isHighQualityLoaded && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          className="absolute inset-0"
          animation="wave"
        />
      )}
      
      {/* Low quality image */}
      {lowQualitySrc && (
        <img
          src={lowQualitySrc}
          alt={alt}
          onLoad={() => setIsLowQualityLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-300 blur-sm
            ${isLowQualityLoaded && !isHighQualityLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
      
      {/* High quality image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsHighQualityLoaded(true)}
        className={`
          w-full h-full object-cover
          transition-opacity duration-500
          ${isHighQualityLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
};

// Image gallery with lazy loading
interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  className?: string;
  itemClassName?: string;
  columns?: number;
}

export const LazyImageGallery: React.FC<LazyImageGalleryProps> = ({
  images,
  className = '',
  itemClassName = '',
  columns = 3
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols]} ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={`aspect-square ${itemClassName}`}>
          <LazyImage
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover rounded-lg hover-lift cursor-pointer"
            placeholder={image.thumbnail}
            threshold={0.1}
            rootMargin="100px"
          />
        </div>
      ))}
    </div>
  );
};