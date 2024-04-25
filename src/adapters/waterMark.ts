/* eslint-disable no-console */
/* eslint-disable no-plusplus */
import cv, { Mat } from 'opencv-ts'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import EnhancerWaterMark from 'watermark-enhancer'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
    img.src = url
  })
}
function processImage(
  img: HTMLImageElement,
  canvasId?: string
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
      // eslint-disable-next-line camelcase
      const src_rgb = new cv.Mat()
      // 将图像从RGBA转换为RGB
      cv.cvtColor(src, src_rgb, cv.COLOR_RGBA2RGB)
      if (canvasId) {
        cv.imshow(canvasId, src_rgb)
      }
      resolve(imgProcess(src_rgb))

      src.delete()
      src_rgb.delete()
    } catch (error) {
      reject(error)
    }
  })
}

function imageDataToDataURL(imageFile: imageFile) {
  // 创建 canvas
  const canvas = document.createElement('canvas')
  canvas.width = imageFile.width
  canvas.height = imageFile.height

  // 绘制 imageFile 到 canvas
  const ctx = canvas.getContext('2d')
  ctx.putImageData(imageFile.getData(), 0, 0)

  // 导出为数据 URL
  return canvas.toDataURL()
}
export default async function waterMark(
  imageFile: File | HTMLImageElement,
  callback: (progress: number) => void
) {
  console.timeEnd('sessionCreate')

  const img =
    imageFile instanceof HTMLImageElement
      ? imageFile
      : await loadImage(URL.createObjectURL(imageFile))
  const imageTersorData = await processImage(img)
  const imageTensor = new ort.Tensor('float32', imageTersorData, [
    1,
    3,
    img.height,
    img.width,
  ])
  
    console.time('sessionCreate')
  const result = await EnhancerWaterMark(
    {
      width: '100',
      height: '80',
      rotate: '17',
      content: 'test',
      // asyncContent: renderEffectContent,
    },
    {
      content: 'watermark loading...',
      color: 'black',
      background: 'white',
    }
  )(imageFile)
  console.log(imageFile, 'imageFile')
  console.timeEnd('sessionCreate')
  
  console.time('postProcess')
  const outsTensor = result
  const chwToHwcData = postProcess(
    outsTensor.data,
    img.width * 4,
    img.height * 4
  )
  const imageData = new ImageData(
    new Uint8ClampedArray(chwToHwcData),
    img.width * 4,
    img.height * 4
  )
  console.log(imageData, 'imageData')
  const url = imageDataToDataURL(imageData)
  console.timeEnd('postProcess')

  return url
}
