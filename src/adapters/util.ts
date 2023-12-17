export async function checkWebgpu() {
  // @ts-ignore
  if (!navigator.gpu) {
    return false
  }
  // @ts-ignore
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return false
  }
  return true
}
export const wasm = () =>
  typeof WebAssembly === 'object' &&
  typeof WebAssembly.instantiate === 'function'
export const threads = () =>
  (async e => {
    try {
      return (
        typeof MessageChannel !== 'undefined' &&
          new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),
        WebAssembly.validate(e)
      )
      // eslint-disable-next-line @typescript-eslint/no-shadow
    } catch (e) {
      return !1
    }
  })(
    new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1,
      1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11,
    ])
  )
export const simd = async () =>
  WebAssembly.validate(
    new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10,
      1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
    ])
  )

export const getCapabilities = async () => {
  return {
    webgpu: await checkWebgpu(),
    wasm: wasm(),
    simd: await simd(),
    threads: await threads(),
  }
}
const version = '1.16.3'
export const getTagSrc = async () => {
  const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`
  const capablilities = await getCapabilities()
  if (capablilities.webgpu) {
    return `${prefix}ort.webgpu.min.js`
  }
  if (capablilities.wasm) {
    if (capablilities.simd || capablilities.threads) {
      return `${prefix}ort.wasm.min.js`
    }
    return `${prefix}ort.wasm-core.min.js`
  }
  return `${prefix}ort.min.js`
}

export const loadingOnnxruntime = async () => {
  const script = document.createElement('script')

  // 设置script标签的属性，例如src
  script.src = await getTagSrc() // 替换为您要加载的脚本的URL

  // 将script标签添加到文档的head部分
  document.head.appendChild(script)
}

export async function checkGpu() {
  return !navigator?.gpu && !(await navigator.gpu?.requestAdapter())
}
