import localforage from 'localforage'

localforage.config({
  name: 'modelCache',
})

export async function saveModel(modelBlob: ArrayBuffer) {
  await localforage.setItem('model', modelBlob)
}

export async function loadModel(): Promise<ArrayBuffer> {
  const model = (await localforage.getItem('model')) as ArrayBuffer
  return model
}

export async function modelExists() {
  const model = await loadModel()
  return model !== null && model !== undefined
}

export async function ensureModel() {
  if (await modelExists()) {
    return loadModel()
  }
  const response = await fetch(
    'https://cdn.jsdelivr.net/gh/lxfater/inpaint-web@main/model/migan.onnx'
  )
  const buffer = await response.arrayBuffer()
  await saveModel(buffer)
  return buffer
}
