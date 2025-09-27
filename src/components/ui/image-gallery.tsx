"use client"

import { useEffect, useRef } from "react"
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl"
import CONSTANTS from "@/Constant"

type GL = Renderer["gl"]

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t
}

function autoBind(instance: any): void {
  const proto = Object.getPrototypeOf(instance)
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof instance[key] === "function") {
      instance[key] = instance[key].bind(instance)
    }
  })
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/)
  return match ? Number.parseInt(match[1], 10) : 30
}

function createTextTexture(
  gl: GL,
  text: string,
  font = "bold 30px monospace",
  color = "black",
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not get 2d context")

  context.font = font
  const metrics = context.measureText(text)
  const textWidth = Math.ceil(metrics.width)
  const fontSize = getFontSize(font)
  const textHeight = Math.ceil(fontSize * 1.2)

  canvas.width = textWidth + 20
  canvas.height = textHeight + 20

  context.font = font
  context.fillStyle = color
  context.textBaseline = "middle"
  context.textAlign = "center"
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new Texture(gl, { generateMipmaps: false })
  texture.image = canvas

  return { texture, width: canvas.width, height: canvas.height }
}

interface TitleProps {
  gl: GL
  plane: Mesh
  renderer: Renderer
  text: string
  textColor?: string
  font?: string
}

class Title {
  gl: GL
  plane: Mesh
  renderer: Renderer
  text: string
  textColor: string
  font: string
  mesh!: Mesh

  constructor({ gl, plane, renderer, text, textColor = "#545050", font = "30px sans-serif" }: TitleProps) {
    autoBind(this)
    this.gl = gl
    this.plane = plane
    this.renderer = renderer
    this.text = text
    this.textColor = textColor
    this.font = font
    this.createMesh()
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor)
    const geometry = new Plane(this.gl)
    const program = new Program(this.gl, {
      vertex: `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragment: `
      precision highp float;
      uniform sampler2D tMap;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tMap, vUv);
        if (color.a < 0.1) discard;
        gl_FragColor = color;
      }
    `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    })
    this.mesh = new Mesh(this.gl, { geometry, program })

    const aspect = width / height
    const textHeightScaled = this.plane.scale.y * 0.15
    const textWidthScaled = textHeightScaled * aspect

    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1)
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05
    this.mesh.setParent(this.plane)
  }
}

interface ScreenSize {
  width: number
  height: number
}
interface Viewport {
  width: number
  height: number
}

interface ImageMediaProps {
  geometry: Plane
  gl: GL
  media: string
  type: 'image' | 'video'
  index: number
  length: number
  renderer: Renderer
  scene: Transform
  screen: ScreenSize
  text: string
  viewport: Viewport
  bend: number
  textColor: string
  borderRadius?: number
  font?: string
  skewStrength?: number
  depthStrength?: number
  curveYStrength?: number
  gapEqualize?: number
}

class ImageMedia {
  extra = 0
  geometry: Plane
  gl: GL
  media: string
  type: 'image' | 'video'
  index: number
  length: number
  renderer: Renderer
  scene: Transform
  screen: ScreenSize
  text: string
  viewport: Viewport
  bend: number
  textColor: string
  borderRadius: number
  font?: string
  program!: Program
  plane!: Mesh
  title!: Title
  scale!: number
  padding!: number
  width!: number
  widthTotal!: number
  x!: number
  speed = 0
  isBefore = false
  isAfter = false
  baseScaleX!: number
  baseScaleY!: number
  R!: number
  thetaMax!: number
  bendSign!: number
  skewStrength: number
  depthStrength: number
  curveYStrength: number
  gapEqualize: number
  mediaElement!: HTMLImageElement | HTMLVideoElement

  constructor({
    geometry,
    gl,
    media,
    type,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
    skewStrength,
    depthStrength,
    curveYStrength,
    gapEqualize,
  }: ImageMediaProps) {
    this.geometry = geometry
    this.gl = gl
    this.media = media
    this.type = type
    this.index = index
    this.length = length
    this.renderer = renderer
    this.scene = scene
    this.screen = screen
    this.text = text
    this.viewport = viewport
    this.bend = bend
    this.textColor = textColor
    this.borderRadius = borderRadius
    this.font = font
    this.skewStrength = skewStrength ?? 3.0
    this.depthStrength = depthStrength ?? 2.0
    this.curveYStrength = curveYStrength ?? 1.25
    this.gapEqualize = gapEqualize ?? 0.65

    this.createShader()
    this.createMesh()
    this.createTitle()
    this.onResize()
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false })

    // Create media element
    if (this.type === 'video') {
      this.mediaElement = document.createElement('video')
      this.mediaElement.crossOrigin = "anonymous"
      this.mediaElement.muted = true
      this.mediaElement.autoplay = true
      this.mediaElement.loop = true
      this.mediaElement.playsInline = true
      this.mediaElement.oncontextmenu = (e) => e.preventDefault()
    } else {
      this.mediaElement = new Image()
      this.mediaElement.crossOrigin = "anonymous"
      ;(this.mediaElement as HTMLImageElement).oncontextmenu = (e) => e.preventDefault()
    }

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragment: `
      precision highp float;
      uniform vec2 uImageSizes;
      uniform vec2 uPlaneSizes;
      uniform sampler2D tMap;
      uniform float uBorderRadius;
      varying vec2 vUv;

      float roundedBoxSDF(vec2 p, vec2 b, float r) {
        vec2 d = abs(p) - b;
        return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
      }

      void main() {
        vec2 ratio = vec2(
          min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
          min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
        );

        vec2 uv = vec2(
          vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
          vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        vec4 color = texture2D(tMap, uv);

        float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
        if (d > 0.0) discard;

        gl_FragColor = vec4(color.rgb, 1.0);
      }
    `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [9, 16] },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    })

    const onLoad = () => {
      texture.image = this.mediaElement
      if (this.type === 'video') {
        this.program.uniforms.uImageSizes.value = [
          (this.mediaElement as HTMLVideoElement).videoWidth || 9,
          (this.mediaElement as HTMLVideoElement).videoHeight || 16,
        ]
      } else {
        this.program.uniforms.uImageSizes.value = [
          (this.mediaElement as HTMLImageElement).naturalWidth || 9,
          (this.mediaElement as HTMLImageElement).naturalHeight || 16,
        ]
      }
      texture.needsUpdate = true
    }

    if (this.type === 'video') {
      ;(this.mediaElement as HTMLVideoElement).addEventListener("loadedmetadata", onLoad)
    } else {
      ;(this.mediaElement as HTMLImageElement).addEventListener("load", onLoad)
    }

    // Load the media
    this.mediaElement.src = this.media

    if (this.type === 'video') {
      const video = this.mediaElement as HTMLVideoElement
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {})
      })
    }
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    })
    this.plane.setParent(this.scene)
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    })
  }

  update(scroll: { current: number; last: number }, direction: "right" | "left") {
    const raw = this.x - scroll.current - this.extra
    const theta = raw / this.R
    const c = Math.max(Math.cos(theta), 0.2)

    const eq = Math.pow(c, this.gapEqualize)
    const px = (Math.sin(theta) / eq) * this.R

    const arc = this.R * (1.0 - Math.cos(theta))
    this.plane.position.x = px
    this.plane.position.z = -arc * this.depthStrength * this.bendSign
    this.plane.position.y = (-arc / this.R) * (this.baseScaleY * this.curveYStrength) * this.bendSign

    this.plane.rotation.z = 0
    this.plane.rotation.y = -Math.sign(raw) * Math.abs(theta) * this.skewStrength

    const dA = Math.min(Math.abs(theta) / this.thetaMax, 1.0)
    const scaleMult = 0.9 + dA * (1.18 - 0.9)
    this.plane.scale.x = this.baseScaleX * scaleMult
    this.plane.scale.y = this.baseScaleY * scaleMult

    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]

    // Update video texture each frame
    if (this.type === 'video') {
      this.program.uniforms.tMap.value.needsUpdate = true
    }

    const planeOffset = this.baseScaleX / 2
    const viewportOffset = this.viewport.width / 2
    this.isBefore = raw + planeOffset < -viewportOffset
    this.isAfter = raw - planeOffset > viewportOffset

    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal
      this.isBefore = this.isAfter = false
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal
      this.isBefore = this.isAfter = false
    }
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen
    if (viewport) this.viewport = viewport

    this.scale = this.screen.height / 1500
    const baseY = (this.viewport.height * (1000 * this.scale)) / this.screen.height
    const baseX = (this.viewport.width * (560 * this.scale)) / this.screen.width
    this.plane.scale.y = baseY
    this.plane.scale.x = baseX
    this.baseScaleX = baseX
    this.baseScaleY = baseY
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]

    const H = this.viewport.width / 2
    this.bendSign = Math.sign(this.bend || 1)
    const Babs = Math.max(Math.abs(this.bend), 0.0001)
    this.R = (H * H + Babs * Babs) / (2 * Babs)
    this.thetaMax = Math.asin(Math.min(H / this.R, 1))

    this.padding = 2.2
    this.width = this.plane.scale.x + this.padding
    this.widthTotal = this.width * this.length
    this.x = this.width * this.index
  }

  destroy() {
    if (this.mediaElement) {
      this.mediaElement.src = ""
    }
  }
}

interface AppConfig {
  items?: { media: string; text: string; type: 'image' | 'video' }[]
  bend?: number
  textColor?: string
  borderRadius?: number
  font?: string
  scrollSpeed?: number
  scrollEase?: number
  skewStrength?: number
  depthStrength?: number
  curveYStrength?: number
  gapEqualize?: number
}

class ImageApp {
  container: HTMLElement
  scrollSpeed: number
  scroll: {
    ease: number
    current: number
    target: number
    last: number
    position?: number
  }
  renderer!: Renderer
  gl!: GL
  camera!: Camera
  scene!: Transform
  planeGeometry!: Plane

  medias: ImageMedia[] = []
  mediasImages: { media: string; text: string; type: 'image' | 'video' }[] = []

  screen!: { width: number; height: number }
  viewport!: { width: number; height: number }

  raf = 0

  boundOnResize!: () => void

  skewStrength?: number
  depthStrength?: number
  curveYStrength?: number
  gapEqualize?: number

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 6,
      textColor = "#111111",
      borderRadius = 0.08,
      font = "bold 30px Figtree",
      scrollSpeed = 2,
      scrollEase = 0.06,
      skewStrength = 3.0,
      depthStrength = 2.0,
      curveYStrength = 1.25,
      gapEqualize = 0.65,
    }: AppConfig,
  ) {
    document.documentElement.classList.remove("no-js")
    this.container = container
    this.scrollSpeed = scrollSpeed
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 }

    this.skewStrength = skewStrength
    this.depthStrength = depthStrength
    this.curveYStrength = curveYStrength
    this.gapEqualize = gapEqualize

    this.createRenderer()
    this.createCamera()
    this.createScene()
    this.onResize()
    this.createGeometry()
    this.createMedias(items, bend, textColor, borderRadius, font)
    this.update()
    this.addEventListeners()
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha: true })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement)
  }

  createCamera() {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 20
  }

  createScene() {
    this.scene = new Transform()
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    })
  }

  createMedias(
    items: { media: string; text: string; type: 'image' | 'video' }[] | undefined,
    bend = 1,
    textColor: string,
    borderRadius: number,
    font: string,
  ) {
    const defaultItems = [
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=modern tech showcase`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=creative design process`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=digital innovation`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=brand storytelling`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=ai technology demo`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=creative workflow`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=marketing campaign`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=product showcase`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=team collaboration`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=business growth`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=creative solutions`, text: "", type: 'image' as const },
      { media: `${CONSTANTS.HOST_URL}/placeholder.svg?height=1280&width=720&query=digital transformation`, text: "", type: 'image' as const },
    ]

    const getNumberOfImages = () => {
      const width = window.innerWidth
      if (width < 768) return 3
      else if (width >= 768 && width < 1024) return 6
      else if (width >= 1024 && width < 1280) return 9
      else return 12
    }

    const numberOfImages = getNumberOfImages()
    const galleryItems = items && items.length ? items.slice(0, numberOfImages) : defaultItems.slice(0, numberOfImages)
    this.mediasImages = galleryItems.concat(galleryItems)

    this.medias = this.mediasImages.map((data, index) => {
      return new ImageMedia({
        geometry: this.planeGeometry,
        gl: this.gl,
        media: data.media,
        type: data.type,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
        skewStrength: this.skewStrength,
        depthStrength: this.depthStrength,
        curveYStrength: this.curveYStrength,
        gapEqualize: this.gapEqualize,
      })
    })
  }


  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    }

    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    })

    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect

    this.viewport = { width, height }

    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }))
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current > this.scroll.last ? "right" : "left"

    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction))
    }

    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.scroll.target -= 0.05 // Auto scroll to the left
    this.raf = window.requestAnimationFrame(this.update.bind(this))
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this)

    window.addEventListener("resize", this.boundOnResize)
  }

  destroy() {
    window.cancelAnimationFrame(this.raf)

    // Clean up image elements
    this.medias.forEach((media) => media.destroy())

    window.removeEventListener("resize", this.boundOnResize)

    if (this.renderer && this.renderer.gl && (this.renderer.gl.canvas as any).parentNode) {
      ;(this.renderer.gl.canvas as any).parentNode.removeChild(this.renderer.gl.canvas as HTMLCanvasElement)
    }
  }
}

export interface ImageCircularGalleryProps {
  items?: { media: string; text: string; type: 'image' | 'video' }[]
  bend?: number
  textColor?: string
  borderRadius?: number
  font?: string
  scrollSpeed?: number
  scrollEase?: number
  skewStrength?: number
  depthStrength?: number
  curveYStrength?: number
  gapEqualize?: number
}

export default function ImageCircularGallery({
  items,
  bend = 6,
  textColor = "#111111",
  borderRadius = 0.08,
  font = "bold 30px Figtree",
  scrollSpeed = 2,
  scrollEase = 0.06,
  skewStrength = 3.0,
  depthStrength = 2.0,
  curveYStrength = 1.25,
  gapEqualize = 0.65,
}: ImageCircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const app = new ImageApp(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
      skewStrength,
      depthStrength,
      curveYStrength,
      gapEqualize,
    })
    return () => {
      app.destroy()
    }
  }, [
    items,
    bend,
    textColor,
    borderRadius,
    font,
    scrollSpeed,
    scrollEase,
    skewStrength,
    depthStrength,
    curveYStrength,
    gapEqualize,
  ])

return (
    <div
      className="w-full h-full overflow-hidden"
      ref={containerRef}
    />
  )}
