/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { DownloadIcon, EyeIcon, ViewBoardsIcon } from '@heroicons/react/outline'
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useWindowSize } from 'react-use'
import { sep } from 'path'
import inpaint from './adapters/inpainting'
import Button from './components/Button'
import Slider from './components/Slider'
import { downloadImage, loadImage, useImage } from './utils'
import Progress from './components/Progress'

interface EditorProps {
  file: File
}

interface Line {
  size?: number
  pts: { x: number; y: number }[]
  src: string
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
  const [renders, setRenders] = useState<HTMLImageElement[]>([])
  const [context, setContext] = useState<CanvasRenderingContext2D>()
  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas')
  })
  const [lines, setLines] = useState<Line[]>([{ pts: [], src: '' }])
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 })
  const [showBrush, setShowBrush] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isInpaintingLoading, setIsInpaintingLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const [generateProgress, setGenerateProgress] = useState(0)
  const [timer, setTimer] = useState(0)
  const modalRef = useRef(null)
  const [separator, setSeparator] = useState<HTMLDivElement>()
  const [useSeparator, setUseSeparator] = useState(false)
  const [originalImg, setOriginalImg] = useState<HTMLDivElement>()
  const [separatorLeft, setSeparatorLeft] = useState(0)
  const historyListRef = useRef<HTMLDivElement>(null)

  const windowSize = useWindowSize()

  const draw = useCallback(() => {
    if (!context) {
      return
    }
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    const currRender = renders[renders.length - 1]
    if (currRender?.src) {
      context.drawImage(currRender, 0, 0)
    } else {
      context.drawImage(original, 0, 0)
    }
    const currentLine = lines[lines.length - 1]
    drawLines(context, [currentLine])
  }, [context, lines, original, renders])

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
    // Just need the finishing touch
    const line = lines.at(-1)
    if (line) drawLines(ctx, [line], 'white')
  }, [context?.canvas.height, context?.canvas.width, lines, maskCanvas])

  // Draw once the original image is loaded
  useEffect(() => {
    if (!context?.canvas) {
      return
    }
    if (isOriginalLoaded) {
      context.canvas.width = original.naturalWidth
      context.canvas.height = original.naturalHeight
      const rW = windowSize.width / original.naturalWidth
      const rH = (windowSize.height - 300) / original.naturalHeight
      if (rW < 1 || rH < 1) {
        console.log(Math.min(rW, rH))
        const newScale = Math.min(rW, rH)
        setScale(newScale)
        setBrushSize(40 / newScale)
      } else {
        setScale(1)
      }
      draw()
    }
  }, [context?.canvas, draw, original, isOriginalLoaded, windowSize])

  // Handle mouse interactions
  useEffect(() => {
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
      if (!original.src || showOriginal) {
        return
      }
      if (lines.at(-1)?.pts.length === 0) {
        return
      }
      setIsInpaintingLoading(true)
      setGenerateProgress(0)
      setTimer(
        window.setInterval(() => {
          setGenerateProgress(p => {
            if (p < 90) return p + 20 * Math.random()
            if (p >= 90 && p < 100) return p + 1 * Math.random()
            window.setTimeout(() => setIsInpaintingLoading(false), 500)
            return p
          })
        }, 1000)
      )

      canvas.removeEventListener('mousemove', onMouseDrag)
      window.removeEventListener('mouseup', onPointerUp)
      refreshCanvasMask()
      try {
        const start = Date.now()
        console.log('inpaint_start')
        // each time based on the last result, the first is the original
        const newFile = renders.at(-1) ?? file
        const res = await inpaint(newFile, maskCanvas.toDataURL())
        if (!res) {
          throw new Error('empty response')
        }
        // TODO: fix the render if it failed loading
        const newRender = new Image()
        newRender.dataset.id = Date.now().toString()
        await loadImage(newRender, res)
        renders.push(newRender)
        lines.push({ pts: [], src: '' } as Line)
        setRenders([...renders])
        setLines([...lines])
        console.log('inpaint_processed', {
          duration: Date.now() - start,
          width: original.naturalWidth,
          height: original.naturalHeight,
        })
      } catch (e: any) {
        console.log('inpaint_failed', {
          error: e,
        })
        // eslint-disable-next-line
        alert(e.message ? e.message : e.toString())
      }

      setGenerateProgress(100)
      if (timer) clearInterval(timer)
      historyListRef.current?.scrollTo(historyListRef.current.offsetWidth, 0)
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
      if (!original.src || showOriginal) {
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
    canvas.onmouseenter = () => setShowBrush(true && !showOriginal)
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
    original.naturalHeight,
    original.naturalWidth,
    scale,
    renders,
    showOriginal,
  ])

  useEffect(() => {
    if (!separator || !originalImg) return

    const separatorMove = (ev: MouseEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      const originalRect = originalImg.getBoundingClientRect()
      const separatorOffsetLeft = (ev.pageX - originalRect.left) / scale
      if (
        separatorOffsetLeft <= original.naturalWidth &&
        separatorOffsetLeft >= 0
      ) {
        setSeparatorLeft(separatorOffsetLeft)
      } else if (separatorOffsetLeft < 0) {
        setSeparatorLeft(0)
      } else if (separatorOffsetLeft > original.naturalWidth) {
        setSeparatorLeft(original.naturalWidth)
      }
    }

    const separatorDown = () => {
      window.addEventListener('mousemove', separatorMove)
      setUseSeparator(true)
    }

    const separatorUp = () => {
      window.removeEventListener('mousemove', separatorMove)
      setUseSeparator(false)
    }

    separator.addEventListener('mousedown', separatorDown)
    window.addEventListener('mouseup', separatorUp)

    return () => {
      separator.removeEventListener('mousedown', separatorDown)
      window.removeEventListener('mouseup', separatorUp)
    }
  }, [scale, separator, originalImg])

  function download() {
    const base64 = context?.canvas.toDataURL(file.type)
    if (!base64) {
      throw new Error('could not get canvas data')
    }
    const name = file.name.replace(/(\.[\w\d_-]+)$/i, '_cleanup$1')
    downloadImage(base64, name)
  }

  const undo = useCallback(async () => {
    const l = lines
    l.pop()
    l.pop()
    setLines([...l, { pts: [], src: '' }])
    const r = renders
    r.pop()
    setRenders([...r])
  }, [lines, renders])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!renders.length) {
        return
      }
      const isCmdZ = (event.metaKey || event.ctrlKey) && event.key === 'z'
      if (isCmdZ) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [renders, undo])

  const backTo = useCallback(
    (index: number) => {
      const l = lines
      while (l.length > index + 1) {
        l.pop()
      }
      setLines([...l, { pts: [], src: '' }])
      const r = renders
      while (r.length > index + 1) {
        r.pop()
      }
      setRenders([...r])
    },
    [renders, lines]
  )

  const History = useMemo(
    () =>
      renders.map((render, index) => {
        return (
          <div
            key={render.dataset.id}
            style={{
              position: 'relative',
              display: 'inline-block',
              flexShrink: 0,
            }}
          >
            <img
              src={render.src}
              alt="render"
              className="rounded-sm"
              style={{
                height: '90px',
              }}
            />
            <Button
              className="hover:opacity-100 opacity-0 cursor-pointer rounded-sm"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onDown={() => backTo(index)}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: '18px',
                  textAlign: 'center',
                }}
              >
                回到这
              </div>
            </Button>
          </div>
        )
      }),
    [renders, backTo]
  )

  return (
    <div
      className={[
        'flex flex-col items-center',
        isInpaintingLoading ? 'animate-pulse-fast pointer-events-none' : '',
      ].join(' ')}
    >
      <div
        ref={historyListRef}
        className={[
          'flex items-left w-full max-w-4xl py-0',
          'flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-5 overflow-auto pb-1',
          'scrollbar-thin scrollbar-thumb-black scrollbar-track-primary scrollbar-rounded-lg overflow-x-scroll',
          scale !== 1 ? 'absolute top-0 justify-center' : 'relative',
        ].join(' ')}
      >
        {History}
      </div>
      <div
        className={[
          scale !== 1 ? 'absolute top-0' : 'relative',
          scale !== 1 ? 'mt-28' : 'mt-6',
        ].join(' ')}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top',
        }}
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
            showOriginal ? '' : 'overflow-hidden',
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
          ref={r => {
            if (r && !originalImg) {
              setOriginalImg(r)
            }
          }}
        >
          <div
            className={[
              'absolute top-0 right-0 pointer-events-none z-10',
              useSeparator ? 'bg-black text-white' : 'bg-primary ',
              'w-1',
              'flex items-center justify-center',
            ].join(' ')}
            style={{
              left: `${separatorLeft}px`,
              height: original.naturalHeight,
              transitionProperty: 'width, height',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDuration: '300ms',
            }}
          >
            <div
              className={[
                'absolute py-2 px-1 rounded-md pointer-events-auto',
                useSeparator ? 'bg-black' : 'bg-primary ',
              ].join(' ')}
              style={{ cursor: 'ew-resize' }}
              ref={r => {
                if (r && !separator) {
                  setSeparator(r)
                }
              }}
            >
              <ViewBoardsIcon
                className="w-5 h-5"
                style={{ cursor: 'ew-resize' }}
              />
            </div>
          </div>
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
              clipPath: `inset(0 0 0 ${separatorLeft}px)`,
            }}
          />
        </div>
      </div>
      {isInpaintingLoading && (
        <div className=" bg-[rgba(255,255,255,0.8)] absolute top-0 left-0 right-0 bottom-0  h-full w-full grid content-center">
          <div ref={modalRef} className="text-xl space-y-5 p-20  w-1/2 mx-auto">
            <p>正在处理中，请耐心等待。。。</p>
            <p>It is being processed, please be patient...</p>
            <Progress percent={generateProgress} />
          </div>
        </div>
      )}

      {showBrush && (
        <div
          className="hidden sm:block fixed rounded-full bg-red-500 bg-opacity-50 pointer-events-none"
          style={{
            width: `${brushSize * scale}px`,
            height: `${brushSize * scale}px`,
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
        {renders.length > 0 && (
          <Button
            primary
            onClick={undo}
            icon={
              <svg
                className="w-6 h-6"
                width="19"
                height="9"
                viewBox="0 0 19 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            Undo
          </Button>
        )}
        <Slider
          label="Brush Size"
          min={10}
          max={200}
          value={brushSize}
          onChange={setBrushSize}
        />

        <Button
          primary={showOriginal}
          icon={<EyeIcon className="w-6 h-6" />}
          onUp={() => {
            setShowOriginal(!showOriginal)
            setTimeout(() => setSeparatorLeft(0), 300)
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
