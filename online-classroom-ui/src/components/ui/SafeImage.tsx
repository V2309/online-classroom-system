//./src/components/ui/SafeImage.tsx

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { processImageUrl } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

export default function SafeImage({ 
  src, 
  alt, 
  width = 400, 
  height = 225,
  className = '',
  fill = false,
  sizes,
  priority = false
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    console.log("🖼️ SafeImage processing src:", src);
    const processedUrl = processImageUrl(src || '');
    console.log("🖼️ Processed URL:", processedUrl);
    return processedUrl;
  });
  const [hasError, setHasError] = useState(false);

  // Update imgSrc when src prop changes
  useEffect(() => {
    console.log("🔄 SafeImage src changed:", src);
    const newProcessedUrl = processImageUrl(src || '');
    console.log("🔄 New processed URL:", newProcessedUrl);
    setImgSrc(newProcessedUrl);
    setHasError(false);
  }, [src]);

 

  const commonProps = {
    alt,
    className,
    priority,
    sizes
  };

  if (fill) {
    return (
      <Image
        {...commonProps}
        src={imgSrc}
        fill
        alt='safe image'
      />
    );
  }

  return (
    <Image
      {...commonProps}
      src={imgSrc}
      width={width}
      height={height}
      alt='safe image'
    />
  );
}