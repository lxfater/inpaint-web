/* eslint-disable no-console */
/* eslint-disable no-plusplus */
import cv, { Mat } from 'opencv-ts'
import { getCapabilities } from './util'
import { ensureModel } from './cache'

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
        chwArray[c * H * W + h * W + w] = channelData[h * W + w] / 255.0
        // chwArray[c * H * W + h * W + w] = channelData[h * W + w]
      }
    }
  }

  channels.delete() // 清理内存
  return chwArray // 返回转换后的数据
}
async function tileProc(
  inputTensor: ort.Tensor,
  session: ort.InferenceSession,
  callback: (progress: number) => void
) {
  const inputDims = inputTensor.dims
  const imageW = inputDims[3]
  const imageH = inputDims[2]

  const rOffset = 0
  const gOffset = imageW * imageH
  const bOffset = imageW * imageH * 2

  const outputDims = [
    inputDims[0],
    inputDims[1],
    inputDims[2] * 4,
    inputDims[3] * 4,
  ]
  const outputTensor = new ort.Tensor(
    'float32',
    new Float32Array(
      outputDims[0] * outputDims[1] * outputDims[2] * outputDims[3]
    ),
    outputDims
  )

  const outImageW = outputDims[3]
  const outImageH = outputDims[2]
  const outROffset = 0
  const outGOffset = outImageW * outImageH
  const outBOffset = outImageW * outImageH * 2

  const tileSize = 64
  const tilePadding = 6
  const tileSizePre = tileSize - tilePadding * 2

  const tilesx = Math.ceil(inputDims[3] / tileSizePre)
  const tilesy = Math.ceil(inputDims[2] / tileSizePre)

  const { data } = inputTensor

  console.log(inputTensor)
  const numTiles = tilesx * tilesy
  let currentTile = 0

  for (let i = 0; i < tilesx; i++) {
    for (let j = 0; j < tilesy; j++) {
      const ti = Date.now()
      const tileW = Math.min(tileSizePre, imageW - i * tileSizePre)
      const tileH = Math.min(tileSizePre, imageH - j * tileSizePre)
      console.log(`tileW: ${tileW} tileH: ${tileH}`)
      const tileROffset = 0
      const tileGOffset = tileSize * tileSize
      const tileBOffset = tileSize * tileSize * 2

      // padding tile 转移到上面的数据上
      const tileData = new Float32Array(tileSize * tileSize * 3)
      for (let xp = -tilePadding; xp < tileSizePre + tilePadding; xp++) {
        for (let yp = -tilePadding; yp < tileSizePre + tilePadding; yp++) {
          // 计算在data中的一维坐标，防止边缘溢出
          let xim = i * tileSizePre + xp
          if (xim < 0) xim = 0
          else if (xim >= imageW) xim = imageW - 1

          // 计算在data中的一维坐标，防止边缘溢出
          let yim = j * tileSizePre + yp
          if (yim < 0) yim = 0
          else if (yim >= imageH) yim = imageH - 1

          const idx = xim + yim * imageW

          const xt = xp + tilePadding
          const yt = yp + tilePadding
          // const idx = (i * tileSize + x) + (j * tileSize + y) * imageW;
          // 主要转化到一维的坐标上，
          tileData[xt + yt * tileSize + tileROffset] = data[idx + rOffset]
          tileData[xt + yt * tileSize + tileGOffset] = data[idx + gOffset]
          tileData[xt + yt * tileSize + tileBOffset] = data[idx + bOffset]
        }
      }

      const tile = new ort.Tensor('float32', tileData, [
        1,
        3,
        tileSize,
        tileSize,
      ])
      const r = await session.run({ 'input.1': tile })
      const results = {
        output: r['1895'],
      }
      console.log(`pre dims:${results.output.dims}`)

      const outTileW = tileW * 4
      const outTileH = tileH * 4
      const outTileSize = tileSize * 4
      const outTileSizePre = tileSizePre * 4

      const outTileROffset = 0
      const outTileGOffset = outTileSize * outTileSize
      const outTileBOffset = outTileSize * outTileSize * 2

      // add tile to output，直接输出
      for (let x = 0; x < outTileW; x++) {
        for (let y = 0; y < outTileH; y++) {
          const xim = i * outTileSizePre + x
          const yim = j * outTileSizePre + y
          const idx = xim + yim * outImageW
          const xt = x + tilePadding * 4
          const yt = y + tilePadding * 4
          outputTensor.data[idx + outROffset] =
            results.output.data[xt + yt * outTileSize + outTileROffset]
          outputTensor.data[idx + outGOffset] =
            results.output.data[xt + yt * outTileSize + outTileGOffset]
          outputTensor.data[idx + outBOffset] =
            results.output.data[xt + yt * outTileSize + outTileBOffset]
        }
      }
      currentTile++
      const dt = Date.now() - ti
      const remTime = (numTiles - currentTile) * dt
      console.log(
        `tile ${currentTile} of ${numTiles} took ${dt} ms, remaining time: ${remTime} ms`
      )
      callback(Math.round(100 * (currentTile / numTiles)))
    }
  }
  console.log(`output dims:${outputTensor.dims}`)
  return outputTensor
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
function configEnv(capabilities: {
  webgpu: any
  wasm?: boolean
  simd: any
  threads: any
}) {
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
function postProcess(floatData: Float32Array, width: number, height: number) {
  const chwToHwcData = []
  const size = width * height

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < 3; c++) {
        // RGB通道
        const chwIndex = c * size + h * width + w
        const pixelVal = floatData[chwIndex]
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

function imageDataToDataURL(imageData: ImageData) {
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
let model: ArrayBuffer | null = null
export default async function superResolution(
  imageFile: File | HTMLImageElement,
  callback: (progress: number) => void
) {
  console.time('sessionCreate')
  if (!model) {
    const capabilities = await getCapabilities()
    configEnv(capabilities)
    const modelBuffer = await ensureModel('superResolution')
    model = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: [capabilities.webgpu ? 'webgpu' : 'wasm'],
    })
  }
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

  const result = await tileProc(imageTensor, model, callback)
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
