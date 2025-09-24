"use client"

import { useEffect, useRef } from "react"

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t
}

interface MobileImageCarouselProps {
  images?: string[]
  className?: string
}

export default function MobileImageCarousel({
  images = [
    `/placeholder.svg?height=1280&width=720&query=mobile showcase image 1`,
    `/placeholder.svg?height=1280&width=720&query=mobile showcase image 2`,
    `/placeholder.svg?height=1280&width=720&query=mobile showcase image 3`,
  ],
  className = "",
}: MobileImageCarouselProps) {
  const imageRefs = useRef<(HTMLImageElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const scrollCurrent = useRef(0)
  const scrollTarget = useRef(0)
  const scrollEase = 0.08

  // Duplicate images for continuous scroll
  const duplicatedImages = [...images, ...images]

  useEffect(() => {
    imageRefs.current = imageRefs.current.slice(0, duplicatedImages.length)

    duplicatedImages.forEach((image, index) => {
      if (imageRefs.current[index]) {
        const imageEl = imageRefs.current[index]
        if (imageEl) {
          imageEl.src = image
        }
      }
    })
  }, [duplicatedImages])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    const incrementScroll = () => {
      scrollTarget.current += 1 // Adjust speed as needed
    }

    const interval = setInterval(incrementScroll, 16) // ~60fps

    return () => clearInterval(interval)
  }, [])

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
          {duplicatedImages.map((image, index) => (
            <div key={index} className="flex-shrink-0 w-full">
              <div className="relative aspect-[4/5] w-[250px] mx-auto rounded-xl overflow-hidden bg-black">
                <img
                  ref={(el) => (imageRefs.current[index] = el)}
                  src={image || "/placeholder.svg"}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onContextMenu={(e) => e.preventDefault()}
                />

                {/* Image overlay with subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

