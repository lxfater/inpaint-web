/* eslint-disable camelcase */
// @ts-nocheck
/* eslint-disable no-plusplus */
import cv, { Mat } from 'opencv-ts'
import * as ort from 'onnxruntime-web/webgpu'
import { ensureModel } from './cache'

// ort.env.debug = true
// ort.env.logLevel = 'verbose'
// ort.env.webgpu.profilingMode = 'default'

ort.env.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.2/dist/'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
    img.src = url
  })
}
function imgProcess(img: Mat) {
  const channels = new cv.MatVector()
  cv.split(img, channels) // 分割通道

  const C = channels.size() // 通道数
  const H = img.rows // 图像高度
  const W = img.cols // 图像宽度

  const chwArray = new Float32Array(C * H * W) // 创建新的数组来存储转换后的数据

  for (let c = 0; c < C; c++) {
    const channelData = channels.get(c).data // 获取单个通道的数据
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        chwArray[c * H * W + h * W + w] = (channelData[h * W + w] * 2) / 255 - 1
        // chwArray[c * H * W + h * W + w] = channelData[h * W + w]
      }
    }
  }

  channels.delete() // 清理内存
  return chwArray // 返回转换后的数据
}
function markProcess(img: Mat) {
  const channels = new cv.MatVector()
  cv.split(img, channels) // 分割通道

  const C = 1 // 通道数
  const H = img.rows // 图像高度
  const W = img.cols // 图像宽度

  const chwArray = new Float32Array(C * H * W) // 创建新的数组来存储转换后的数据

  for (let c = 0; c < C; c++) {
    const channelData = channels.get(0).data // 获取单个通道的数据
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        chwArray[c * H * W + h * W + w] = channelData[h * W + w] === 255 ? 0 : 1
      }
    }
  }

  channels.delete() // 清理内存
  return chwArray // 返回转换后的数据
}
function processImage(
  img: HTMLImageElement,
  size: number,
  interpolation: number,
  canvasId?: string
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
      const src_rgb = new cv.Mat()
      const dst = new cv.Mat()
      const dsize = new cv.Size(size, size) // 新尺寸
      // 将图像从RGBA转换为RGB
      cv.cvtColor(src, src_rgb, cv.COLOR_RGBA2RGB)
      // 调整图像大小
      cv.resize(src_rgb, dst, dsize, 0, 0, interpolation)
      if (canvasId) {
        cv.imshow(canvasId, dst)
      }
      resolve(imgProcess(dst))

      src.delete()
      src_rgb.delete()
      dst.delete()
    } catch (error) {
      reject(error)
    }
  })
}

function mergeMarkToImg(mask: Float32Array, img: Float32Array) {
  const temp = new Float32Array(img.length)
  const maskTemp = new Float32Array(mask.length)
  const C = 3
  const H = 512
  const W = 512

  for (let c = 0; c < C; c++) {
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        temp[c * H * W + h * W + w] =
          img[c * H * W + h * W + w] * mask[h * W + w]
      }
    }
  }

  for (let h = 0; h < H; h++) {
    for (let w = 0; w < W; w++) {
      maskTemp[h * W + w] = mask[h * W + w] - 0.5
    }
  }

  return [...maskTemp, ...temp]
}

function processMark(
  img: HTMLImageElement,
  size: number,
  interpolation: number,
  canvasId?: string
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
      const src_grey = new cv.Mat()
      const dst = new cv.Mat()
      const dsize = new cv.Size(size, size) // 新尺寸

      // 将图像从RGBA转换为二值化
      cv.cvtColor(src, src_grey, cv.COLOR_BGR2GRAY)

      // 调整图像大小
      cv.resize(src_grey, dst, dsize, 0, 0, interpolation)
      if (canvasId) {
        cv.imshow(canvasId, dst)
      }

      resolve(markProcess(dst))

      src.delete()
      dst.delete()
    } catch (error) {
      reject(error)
    }
  })
}
function postProcess(floatData: Float32Array, width: number, height: number) {
  const chwToHwcData = []
  const size = width * height

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < 3; c++) {
        // RGB通道
        const chwIndex = c * size + h * width + w
        const pixelVal = floatData[chwIndex] * 0.5 + 0.5
        let newPiex = pixelVal
        if (pixelVal > 1) {
          newPiex = 1
        } else if (pixelVal < 0) {
          newPiex = 0
        }
        chwToHwcData.push(newPiex * 255) // 归一化反转
      }
      chwToHwcData.push(255) // Alpha通道
    }
  }
  return chwToHwcData
}
function fuseImg(
  original: Float32Array,
  postData: Float32Array,
  mask: Float32Array
) {
  const C = 3
  const H = 512
  const W = 512
  const temp = new Float32Array(C * H * W)
  for (let c = 0; c < C; c++) {
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        const value = postData[c * H * W + h * W + w]
        temp[c * H * W + h * W + w] =
          original[c * H * W + h * W + w] * mask[h * W + w] +
          value * (1 - mask[h * W + w])
      }
    }
  }
  return temp
}
function resizeImageData(
  imageData,
  targetWidth,
  targetHeight
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 创建一个临时 canvas 用于绘制
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 设置 canvas 大小为目标尺寸
    canvas.width = targetWidth
    canvas.height = targetHeight

    // 创建一个新的 Image 对象用于缩放
    const img = new Image()

    // 当 Image 加载完成后进行绘制和缩放
    img.onload = () => {
      // 绘制图像到 canvas，并且缩放到目标尺寸
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      // 将缩放后的图像转换为 Data URL
      resolve(canvas.toDataURL())
    }

    img.onerror = e => {
      reject(e)
    }

    // 创建一个用于 Image 对象加载的临时 canvas
    const tmpCanvas = document.createElement('canvas')
    const tmpCtx = tmpCanvas.getContext('2d')
    tmpCanvas.width = imageData.width
    tmpCanvas.height = imageData.height

    // 将 ImageData 绘制到临时 canvas
    tmpCtx.putImageData(imageData, 0, 0)

    // 将临时 canvas 的内容转换为 Image 对象可以加载的 URL
    img.src = tmpCanvas.toDataURL()
  })
}
function mergeImg(
  outImgMat: Mat,
  originalImg: HTMLImageElement,
  originalMark: HTMLImageElement
) {
  const originalMat = cv.imread(originalImg)
  const originalMarkMat = cv.imread(originalMark)
  const H = originalImg.height
  const W = originalImg.width
  const C = 4
  const temp = []
  function imageDataToDataURL(imageData) {
    // 创建 canvas
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height

    // 绘制 imageData 到 canvas
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imageData, 0, 0)

    // 导出为数据 URL
    return canvas.toDataURL()
  }
  for (let i = 0; i < originalMarkMat.data.length; i++) {
    const realMark = originalMarkMat.data[i] === 255 ? 0 : 1
    const value = outImgMat.data[i]
    temp[i] = originalMat.data[i] * realMark + value * (1 - realMark)
  }
  originalMat.delete()
  originalMarkMat.delete()

  const url = imageDataToDataURL(
    new ImageData(new Uint8ClampedArray(temp), W, H)
  )

  return url
}
export default async function inpaint(imageFile: File, maskBase64: string) {
  const modelBuffer = await ensureModel()
  const model = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ['webgpu'],
  })
  // 核心代码在这里
  console.time('preProcess')
  const fileUrl = URL.createObjectURL(imageFile)
  const markUrl = maskBase64

  const originalImg = await loadImage(fileUrl)
  const originalMark = await loadImage(markUrl)
  const size = 512
  const img = await processImage(originalImg, size, cv.INTER_CUBIC)
  const mark = await processMark(originalMark, size, cv.INTER_NEAREST)
  const input = mergeMarkToImg(mark, img)
  console.timeEnd('preProcess')
  console.time('run')
  const Tensor = new ort.Tensor('float32', input, [1, 4, size, size])
  const Feed: {
    [key: string]: any
  } = {}
  Feed[model.inputNames[0]] = Tensor
  const results = await model.run(Feed)
  const outsTensor = results[model.outputNames[0]]
  console.timeEnd('run')

  const chwToHwcData = postProcess(outsTensor.data, size, size)
  const imageData = new ImageData(
    new Uint8ClampedArray(chwToHwcData),
    size,
    size
  )
  const dst = new cv.Mat()
  const dsize = new cv.Size(originalImg.width, originalImg.height)
  const outImgMat = cv.matFromImageData(imageData)
  cv.resize(outImgMat, dst, dsize, 0, 0, cv.INTER_CUBIC)
  console.time('postProcess')
  const result = mergeImg(dst, originalImg, originalMark)
  console.timeEnd('postProcess')
  dst.delete()
  return result
}
