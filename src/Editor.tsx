import { DownloadIcon, EyeIcon } from '@heroicons/react/outline'
import React, { useCallback, useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'
import { useFirebase } from './adapters/firebase'
import inpaint from './adapters/inpainting'
import Button from './components/Button'
import Slider from './components/Slider'
import { downloadImage, loadImage, useImage } from './utils'

interface EditorProps {
  file: File
}

interface Line {
  size?: number
  pts: { x: number; y: number }[]
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: Line[],
  color = 'rgba(255, 0, 0, 0.5)'
) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  lines.forEach(line => {
    if (!line?.pts.length || !line.size) {
      return
    }
    ctx.lineWidth = line.size
    ctx.beginPath()
    ctx.moveTo(line.pts[0].x, line.pts[0].y)
    line.pts.forEach(pt => ctx.lineTo(pt.x, pt.y))
    ctx.stroke()
  })
}

export default function Editor(props: EditorProps) {
  const { file } = props
  const [brushSize, setBrushSize] = useState(40)
  const [original, isOriginalLoaded] = useImage(file)
  const [render] = useState(new Image())
  const [context, setContext] = useState<CanvasRenderingContext2D>()
  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas')
  })
  const [lines] = useState<Line[]>([{ pts: [] }])
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 })
  const [showBrush, setShowBrush] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isInpaintingLoading, setIsInpaintingLoading] = useState(false)
  const [showSeparator, setShowSeparator] = useState(false)
  const firebase = useFirebase()
  const [scale, setScale] = useState(1)
  const windowSize = useWindowSize()

  const draw = useCallback(() => {
    if (!context) {
      return
    }
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    if (render.src) {
      context.drawImage(render, 0, 0)
    } else {
      context.drawImage(original, 0, 0)
    }
    const currentLine = lines[lines.length - 1]
    drawLines(context, [currentLine])
  }, [context, lines, original, render])

  const refreshCanvasMask = useCallback(() => {
    if (!context?.canvas.width || !context?.canvas.height) {
      throw new Error('canvas has invalid size')
    }
    maskCanvas.width = context?.canvas.width
    maskCanvas.height = context?.canvas.height
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not retrieve mask canvas')
    }
    drawLines(ctx, lines, 'white')
  }, [context?.canvas.height, context?.canvas.width, lines, maskCanvas])

  // Draw once the original image is loaded
  useEffect(() => {
    if (!context?.canvas) {
      return
    }
    if (isOriginalLoaded) {
      firebase?.logEvent('image_loaded', {
        width: original.naturalWidth,
        height: original.naturalHeight,
      })
      context.canvas.width = original.naturalWidth
      context.canvas.height = original.naturalHeight
      const rW = windowSize.width / original.naturalWidth
      const rH = (windowSize.height - 200) / original.naturalHeight
      if (rW < 1 || rH < 1) {
        setScale(Math.min(rW, rH))
      } else {
        setScale(1)
      }
      draw()
    }
  }, [context?.canvas, draw, original, isOriginalLoaded, firebase, windowSize])

  // Handle mouse interactions
  useEffect(() => {
    if (!firebase) {
      return
    }
    const canvas = context?.canvas
    if (!canvas) {
      return
    }
    const onMouseMove = (ev: MouseEvent) => {
      setCoords({ x: ev.pageX, y: ev.pageY })
    }
    const onPaint = (px: number, py: number) => {
      const currLine = lines[lines.length - 1]
      currLine.pts.push({ x: px, y: py })
      draw()
    }
    const onMouseDrag = (ev: MouseEvent) => {
      const px = ev.offsetX - canvas.offsetLeft
      const py = ev.offsetY - canvas.offsetTop
      onPaint(px, py)
    }

    const onPointerUp = async () => {
      if (!original.src) {
        return
      }
      setIsInpaintingLoading(true)
      canvas.removeEventListener('mousemove', onMouseDrag)
      window.removeEventListener('mouseup', onPointerUp)
      refreshCanvasMask()
      try {
        const start = Date.now()
        firebase?.logEvent('inpaint_start')
        const { token } = await firebase.getAppCheckToken()
        const res = await inpaint(file, maskCanvas.toDataURL(), token)
        if (!res) {
          throw new Error('empty response')
        }
        // TODO: fix the render if it failed loading
        await loadImage(render, res)
        firebase?.logEvent('inpaint_processed', {
          duration: Date.now() - start,
          width: original.naturalWidth,
          height: original.naturalHeight,
        })
      } catch (e: any) {
        firebase?.logEvent('inpaint_failed', {
          error: e,
        })
        // eslint-disable-next-line
        alert(e.message ? e.message : e.toString())
      }

      lines.push({ pts: [] } as Line)
      setIsInpaintingLoading(false)
      draw()
    }
    window.addEventListener('mousemove', onMouseMove)

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      const currLine = lines[lines.length - 1]
      const coords = canvas.getBoundingClientRect()
      currLine.pts.push({
        x: (ev.touches[0].clientX - coords.x) / scale,
        y: (ev.touches[0].clientY - coords.y) / scale,
      })
      draw()
    }
    const onPointerStart = () => {
      if (!original.src) {
        return
      }
      const currLine = lines[lines.length - 1]
      currLine.size = brushSize
      canvas.addEventListener('mousemove', onMouseDrag)
      window.addEventListener('mouseup', onPointerUp)
      // onPaint(e)
    }

    canvas.addEventListener('touchstart', onPointerStart)
    canvas.addEventListener('touchmove', onTouchMove)
    canvas.addEventListener('touchend', onPointerUp)
    canvas.onmouseenter = () => setShowBrush(true)
    canvas.onmouseleave = () => setShowBrush(false)
    canvas.onmousedown = onPointerStart

    return () => {
      canvas.removeEventListener('mousemove', onMouseDrag)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('touchstart', onPointerStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onPointerUp)
      canvas.onmouseenter = null
      canvas.onmouseleave = null
      canvas.onmousedown = null
    }
  }, [
    brushSize,
    context,
    file,
    draw,
    lines,
    refreshCanvasMask,
    maskCanvas,
    original.src,
    render,
    firebase,
    original.naturalHeight,
    original.naturalWidth,
    scale,
  ])

  function download() {
    firebase?.logEvent('download')
    const base64 = context?.canvas.toDataURL(file.type)
    if (!base64) {
      throw new Error('could not get canvas data')
    }
    const name = file.name.replace(/(\.[\w\d_-]+)$/i, '_cleanup$1')
    downloadImage(base64, name)
  }

  return (
    <div
      className={[
        'flex flex-col items-center',
        isInpaintingLoading ? 'animate-pulse-fast pointer-events-none' : '',
      ].join(' ')}
    >
      <div
        className={[scale !== 1 ? 'absolute top-0' : 'relative'].join(' ')}
        style={{ transform: `scale(${scale})` }}
      >
        <canvas
          className="rounded-sm"
          style={showBrush ? { cursor: 'none' } : {}}
          ref={r => {
            if (r && !context) {
              const ctx = r.getContext('2d')
              if (ctx) {
                setContext(ctx)
              }
            }
          }}
        />
        <div
          className={[
            'absolute top-0 right-0 pointer-events-none',
            'overflow-hidden',
            'border-primary',
            showSeparator ? 'border-l-4' : '',
            // showOriginal ? 'border-opacity-100' : 'border-opacity-0',
          ].join(' ')}
          style={{
            width: showOriginal
              ? `${Math.round(original.naturalWidth)}px`
              : '0px',
            height: original.naturalHeight,
            transitionProperty: 'width, height',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDuration: '300ms',
          }}
        >
          <img
            className="absolute right-0"
            src={original.src}
            alt="original"
            width={`${original.naturalWidth}px`}
            height={`${original.naturalHeight}px`}
            style={{
              width: `${original.naturalWidth}px`,
              height: `${original.naturalHeight}px`,
              maxWidth: 'none',
            }}
          />
        </div>
      </div>

      {showBrush && (
        <div
          className="hidden sm:block absolute rounded-full bg-red-500 bg-opacity-50 pointer-events-none"
          style={{
            width: `${brushSize}px`,
            height: `${brushSize}px`,
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      <div
        className={[
          'flex items-center w-full max-w-4xl py-6',
          'flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-5',
          scale !== 1
            ? 'absolute bottom-0 justify-center'
            : 'relative justify-between',
        ].join(' ')}
      >
        <Slider
          label="Brush Size"
          min={10}
          max={150}
          value={brushSize}
          onChange={setBrushSize}
        />
        <Button
          icon={<EyeIcon className="w-6 h-6" />}
          onDown={() => {
            setShowSeparator(true)
            setShowOriginal(true)
          }}
          onUp={() => {
            setShowOriginal(false)
            setTimeout(() => setShowSeparator(false), 300)
          }}
        >
          Original
        </Button>
        <Button
          primary
          icon={<DownloadIcon className="w-6 h-6" />}
          onClick={download}
        >
          Download
        </Button>
      </div>
    </div>
  )
}
