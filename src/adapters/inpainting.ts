// @ts-nocheck
/* eslint-disable camelcase */
/* eslint-disable no-plusplus */
import cv, { Mat } from 'opencv-ts'
import { ensureModel } from './cache'
import { getCapabilities } from './util'
import type { modelType } from './cache'
// ort.env.debug = true
// ort.env.logLevel = 'verbose'
// ort.env.webgpu.profilingMode = 'default'

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

  const chwArray = new Uint8Array(C * H * W) // 创建新的数组来存储转换后的数据

  for (let c = 0; c < C; c++) {
    const channelData = channels.get(c).data // 获取单个通道的数据
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        chwArray[c * H * W + h * W + w] = channelData[h * W + w]
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

  const chwArray = new Uint8Array(C * H * W) // 创建新的数组来存储转换后的数据

  for (let c = 0; c < C; c++) {
    const channelData = channels.get(0).data // 获取单个通道的数据
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        chwArray[c * H * W + h * W + w] = (channelData[h * W + w] !== 255) * 255
      }
    }
  }

  channels.delete() // 清理内存
  return chwArray // 返回转换后的数据
}
function processImage(
  img: HTMLImageElement,
  canvasId?: string
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
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

function processMark(
  img: HTMLImageElement,
  canvasId?: string
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
      const src_grey = new cv.Mat()

      // 将图像从RGBA转换为二值化
      cv.cvtColor(src, src_grey, cv.COLOR_BGR2GRAY)

      if (canvasId) {
        cv.imshow(canvasId, src_grey)
      }

      resolve(markProcess(src_grey))

      src.delete()
    } catch (error) {
      reject(error)
    }
  })
}
function postProcess(uint8Data: Uint8Array, width: number, height: number) {
  const chwToHwcData = []
  const size = width * height

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < 3; c++) {
        // RGB通道
        const chwIndex = c * size + h * width + w
        const pixelVal = uint8Data[chwIndex]
        let newPiex = pixelVal
        if (pixelVal > 255) {
          newPiex = 255
        } else if (pixelVal < 0) {
          newPiex = 0
        }
        chwToHwcData.push(newPiex) // 归一化反转
      }
      chwToHwcData.push(255) // Alpha通道
    }
  }
  return chwToHwcData
}

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

function configEnv(capabilities) {
  ort.env.wasm.wasmPaths =
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/'
  if (capabilities.webgpu) {
    ort.env.wasm.numThreads = 1
  } else {
    if (capabilities.threads) {
      ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4
    }
    if (capabilities.simd) {
      ort.env.wasm.simd = true
    }
    ort.env.wasm.proxy = true
  }
  console.log('env', ort.env.wasm)
}
const resizeMark = (
  image: HTMLImageElement,
  width: number,
  height: number
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    // 将图片绘制到canvas上，并调整大小
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Unable to get canvas context'))
      return
    }
    ctx.drawImage(image, 0, 0, width, height)

    // 获取调整大小后的图片URL
    const resizedImageUrl = canvas.toDataURL()

    // 创建一个新的Image对象并设置其src为调整大小后的图片URL
    const resizedImage = new Image()
    resizedImage.onload = () => resolve(resizedImage)
    resizedImage.onerror = () =>
      reject(new Error('Failed to load resized image'))
    resizedImage.src = resizedImageUrl
  })
}
let model: ArrayBuffer | null = null
export default async function inpaint(
  imageFile: File | HTMLImageElement,
  maskBase64: string
) {
  console.time('sessionCreate')
  if (!model) {
    const capabilities = await getCapabilities()
    configEnv(capabilities)
    const modelBuffer = await ensureModel('inpaint')
    model = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: [capabilities.webgpu ? 'webgpu' : 'wasm'],
    })
  }
  console.timeEnd('sessionCreate')
  console.time('preProcess')

  const [originalImg, originalMark] = await Promise.all([
    imageFile instanceof HTMLImageElement
      ? imageFile
      : loadImage(URL.createObjectURL(imageFile)),
    loadImage(maskBase64),
  ])

  const [img, mark] = await Promise.all([
    processImage(originalImg),
    processMark(
      await resizeMark(originalMark, originalImg.width, originalImg.height)
    ),
  ])

  const imageTensor = new ort.Tensor('uint8', img, [
    1,
    3,
    originalImg.height,
    originalImg.width,
  ])

  const maskTensor = new ort.Tensor('uint8', mark, [
    1,
    1,
    originalImg.height,
    originalImg.width,
  ])

  const Feed: {
    [key: string]: any
  } = {
    [model.inputNames[0]]: imageTensor,
    [model.inputNames[1]]: maskTensor,
  }

  console.timeEnd('preProcess')

  console.time('run')
  const results = await model.run(Feed)
  console.timeEnd('run')

  console.time('postProcess')
  const outsTensor = results[model.outputNames[0]]
  const chwToHwcData = postProcess(
    outsTensor.data,
    originalImg.width,
    originalImg.height
  )
  const imageData = new ImageData(
    new Uint8ClampedArray(chwToHwcData),
    originalImg.width,
    originalImg.height
  )
  console.log(imageData, 'imageData')
  const result = imageDataToDataURL(imageData)
  console.timeEnd('postProcess')

  return result
}
