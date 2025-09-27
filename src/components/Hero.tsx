import { useEffect, useState, lazy, Suspense, useRef } from "react"
const Galaxy = lazy(() => import("./Galaxy-bg"))
const ImageCircularGallery = lazy(() => import("@/components/ui/image-gallery"))
const MobileImageCarousel = lazy(() => import("@/components/ui/mobile-gallery"))
import GlowingButton from "@/components/animated-button"
import FloatingIcon from "@/components/icon-background"
import { throttle } from "@/lib/utils"
import CONSTANTS from '@/Constant';

const GalleryPlaceholder = () => (
  <div className="relative w-full h-[62vh] sm:h-[56vh] md:h-[58vh] lg:h-[60vh]" aria-hidden="true" />
)

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false)
  const parallaxElementsRef = useRef<NodeListOf<HTMLElement> | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile, { passive: true })
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Optional parallax for non-mobile
  useEffect(() => {
    if (isMobile) return
    // Cache the elements
    parallaxElementsRef.current = document.querySelectorAll<HTMLElement>(".parallax")
    const handleScroll = throttle(() => {
      const scrollY = window.scrollY
      parallaxElementsRef.current?.forEach((el) => {
        const speed = Number.parseFloat(el.dataset.speed || "0.05")
        const yPos = -scrollY * speed
        el.style.setProperty("--parallax-y", `${yPos}px`)
        el.style.transform = `translate3d(0, var(--parallax-y), 0)`
      })
    }, 16) // ~60fps throttle
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMobile])

  const getScrollSpeed = () => {
    return 2
  }

  const imageData = [
    { image: `${CONSTANTS.HOST_URL}/1.jpg`, text: "" },
    { image: `${CONSTANTS.HOST_URL}/2.jpg`, text: "" },
    { image: `${CONSTANTS.HOST_URL}/3.jpg`, text: "" },
    { image: `${CONSTANTS.HOST_URL}/4.jpg`, text: "" },
    { image: `${CONSTANTS.HOST_URL}/5.jpg`, text: "" },
    { image: `${CONSTANTS.HOST_URL}/6.jpg`, text: "" },
  ]

  const videoData = [
    { video: `${CONSTANTS.HOST_URL}/1.mp4`, text: "" },
    { video: `${CONSTANTS.HOST_URL}/2.mp4`, text: "" },
    { video: `${CONSTANTS.HOST_URL}/3.mp4`, text: "" },
    { video: `${CONSTANTS.HOST_URL}/4.mp4`, text: "" },
    { video: `${CONSTANTS.HOST_URL}/5.mp4`, text: "" },
    { video: `${CONSTANTS.HOST_URL}/6.mp4`, text: "" },
  ]

  const useVideos = CONSTANTS.MEDIA_TYPE === 'video'
  const mediaData = useVideos
    ? videoData.map(item => ({ media: item.video, text: item.text, type: 'video' as const }))
    : imageData.map(item => ({ media: item.image, text: item.text, type: 'image' as const }))

  const mobileMedia = mediaData.slice(0, 3).map((item) => ({ src: item.media, type: item.type }))

  useEffect(() => {
    const preloadMedia = () => {
      const mediaToPreload = isMobile ? mobileMedia : mediaData
      mediaToPreload.forEach((item) => {
        if (item.type === 'video') {
          const video = document.createElement('video')
          video.src = item.media
          video.preload = 'auto'
          video.muted = true // Required for autoplay
          video.load() // Force loading
        } else {
          const img = new Image()
          img.src = item.media
        }
      })
    }

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadMedia, 100)
    return () => clearTimeout(timer)
  }, [isMobile, mobileMedia, mediaData])

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden" aria-label="Hero section">
      <Suspense fallback={null}>
        <div style={{ width: "100%", height: "1000px", position: "absolute" }}>
          <Galaxy mouseRepulsion mouseInteraction density={0.2} glowIntensity={0.2} repulsionStrength={0.5} />
        </div>
      </Suspense>

      <div className="pt-24 sm:pt-20 md:pt-24 bg-transparent">
        <div className="px-4 sm:px-6">
          <div className="mx-auto z-30 max-w-4xl mt-5 text-center">
            {/* Headline */}
            <div
              className="font-bold leading-tight opacity-0 animate-fade-in font-montserrat text-xl sm:text-2xl md:text-2xl lg:text-4xl tracking-tight"
              style={{ animationDelay: "0.05s" }}
            >
              {"A Goldmine for "}
              <span className="text-primary font-nunito">{"Brands"}</span>
              {" an"}
              <span className="relative inline-block">
                {"d"}
                <FloatingIcon
                  icon={`${CONSTANTS.HOST_URL}/3zap.svg`}
                  containerClassName="absolute -top-6 left-1/2 -translate-x-1/3 w-8 h-8 sm:-top-6 sm:w-10 sm:h-10 md:-top-8 md:w-12 md:h-12 lg:-top-8 lg:w-12 lg:h-12 xl:-top-10 xl:w-14 xl:h-16"
                  opacity={1}
                  zIndex={10}
                  enableRotation
                  rotationRange={4}
                />
              </span>{" "}
              <br />
              {"A Golden Chance for "}
              <span className="text-primary font-nunito">{"Creators."}</span>
            </div>

            {/* Subheader */}
            <div className="relative">
              <div
                className="font-semibold text-primary leading-tight opacity-0 animate-fade-in font-nunito text-sm sm:text-lg md:text-3xl mt-3"
                style={{ animationDelay: "0.1s" }}
              >
                {"AI built for Brands, Backed by AI Creators."}
              </div>
            </div>

            {/* Supporting copy */}
            <p
              style={{ animationDelay: "0.15s" }}
              className="section-subtitle leading-relaxed opacity-0 animate-fade-in text-muted-foreground font-normal font-nunito text-xs sm:text-sm md:text-sm max-w-2xl mx-auto mt-1"
            >
              {
                "Creator Space is a 360° marketing agency that helps AI tools grow through influencer campaigns, community buzz, search visibility, and event amplification, all built by and for the AI community."
              }
            </p>

            {/* CTA */}
            <div
              className="opacity-0 animate-fade-in mt-5 mx-auto w-[150px] sm:w-[160px] relative z-50"
              style={{ animationDelay: "0.2s" }}
            >
              <GlowingButton text="Get In Touch" href="#contact" />
            </div>
          </div>
        </div>

        {/* Bottom curved gallery */}
        <div className="relative z-20 mx-auto -mt-14 w-full px-2 sm:px-4">
          {/* Optional parallax glow */}
          <div
            className="pointer-events-none hidden lg:block absolute -bottom-10 left-1/4 w-64 h-64 xl:w-80 xl:h-80 bg-primary/10 rounded-full blur-3xl -z-10 parallax"
            data-speed="0.05"
            aria-hidden="true"
          />
          <Suspense fallback={<GalleryPlaceholder />}>
            {isMobile ? (
              <div className="relative w-full pt-20 px-4 py-8">
                <MobileImageCarousel media={mobileMedia} className="w-full mx-auto" />
              </div>
            ) : (
              <div className="relative w-full h-[62vh] sm:h-[56vh] md:h-[58vh] lg:h-[60vh] z-10">
                <ImageCircularGallery
                  items={mediaData}
                  bend={-5}
                  skewStrength={3.0}
                  depthStrength={2.0}
                  curveYStrength={1.25}
                  gapEqualize={1}
                  borderRadius={0.08}
                  textColor="#ffffffff"
                  font="bold 30px Figtree"
                  scrollSpeed={getScrollSpeed()}
                  scrollEase={0.06}
                />
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </section>
  )
}
