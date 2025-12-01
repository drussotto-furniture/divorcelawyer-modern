'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LawyerImageWithBlurProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
}

export function LawyerImageWithBlur({ 
  src, 
  alt, 
  className = '', 
  fill = false,
  width,
  height 
}: LawyerImageWithBlurProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      setImageLoaded(true)
    }
    img.src = src
  }, [src])

  if (fill) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Always show blurred background - it will fill the entire container */}
        {imageLoaded && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(30px) brightness(1.1)',
              transform: 'scale(1.2)', // Scale up to ensure edges are covered
            }}
          />
        )}
        
        {/* Subtle gradient overlays on sides for smooth transition */}
        {imageLoaded && (
          <>
            <div 
              className="absolute inset-y-0 left-0 z-10 w-1/3 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              }}
            />
            <div 
              className="absolute inset-y-0 right-0 z-10 w-1/3 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              }}
            />
          </>
        )}

        {/* Main image */}
        <div className="relative z-20 w-full h-full">
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-contain ${className}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Always show blurred background - it will fill the entire container */}
      {imageLoaded && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px) brightness(1.1)',
            transform: 'scale(1.2)', // Scale up to ensure edges are covered
          }}
        />
      )}
      
      {/* Subtle gradient overlays on sides for smooth transition */}
      {imageLoaded && (
        <>
          <div 
            className="absolute inset-y-0 left-0 z-10 w-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />
          <div 
            className="absolute inset-y-0 right-0 z-10 w-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />
        </>
      )}

      {/* Main image */}
      <div className="relative z-20">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`object-contain ${className}`}
        />
      </div>
    </div>
  )
}

