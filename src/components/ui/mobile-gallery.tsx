"use client"

import CONSTANTS from "@/Constant"
import { useEffect, useRef, useState } from "react"

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t
}

interface MobileImageCarouselProps {
  media?: { src: string, type: 'image' | 'video' }[]
  className?: string
}

export default function MobileImageCarousel({
  media = [
    { src: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=mobile showcase image 1`, type: 'image' as const },
    { src: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=mobile showcase image 2`, type: 'image' as const },
    { src: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=mobile showcase image 3`, type: 'image' as const },
  ],
  className = "",
}: MobileImageCarouselProps) {
  const mediaRefs = useRef<(HTMLImageElement | HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const scrollCurrent = useRef(0)
  const scrollTarget = useRef(0)
  const scrollEase = 0.08
  const [isVisible, setIsVisible] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Duplicate media for continuous scroll
  const duplicatedMedia = [...media, ...media]

  useEffect(() => {
    mediaRefs.current = mediaRefs.current.slice(0, duplicatedMedia.length)

    duplicatedMedia.forEach((item, index) => {
      if (mediaRefs.current[index]) {
        const mediaEl = mediaRefs.current[index]
        if (mediaEl) {
          mediaEl.src = item.src
        }
      }
    })
  }, [duplicatedMedia])

  // IntersectionObserver to pause animations when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const updateScroll = () => {
      if (!innerRef.current || !containerRef.current) return

      const inner = innerRef.current
      scrollCurrent.current = lerp(scrollCurrent.current, scrollTarget.current, scrollEase)
      inner.style.transform = `translateX(-${scrollCurrent.current}px)`

      // Loop continuously by wrapping around
      if (scrollCurrent.current >= inner.scrollWidth / 2) {
        scrollCurrent.current -= inner.scrollWidth / 2
        scrollTarget.current -= inner.scrollWidth / 2
      }

      rafRef.current = requestAnimationFrame(updateScroll)
    }

    rafRef.current = requestAnimationFrame(updateScroll)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const incrementScroll = () => {
      scrollTarget.current += 1 // Adjust speed as needed
    }

    intervalRef.current = setInterval(incrementScroll, 16) // ~60fps

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isVisible])

  return (
    <div className={`relative pt-24 w-full ${className}`}>
      {/* Image Container */}
      <div
        ref={containerRef}
        className="overflow-hidden"
      >
        <div
          ref={innerRef}
          className="flex"
        >
          {duplicatedMedia.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-full">
              <div className="relative aspect-[4/5] w-[250px] mx-auto rounded-xl overflow-hidden bg-black">
                {item.type === 'video' ? (
                  <video
                    ref={(el) => (mediaRefs.current[index] = el)}
                    src={item.src || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <img
                    ref={(el) => (mediaRefs.current[index] = el)}
                    src={item.src || "/placeholder.svg"}
                    alt={`Gallery media ${index + 1}`}
                    className="w-full h-full object-cover"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                )}

                {/* Media overlay with subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

