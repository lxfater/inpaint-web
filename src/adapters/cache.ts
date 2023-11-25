import localforage from 'localforage'

const modelList = [
  {
    name: 'model',
    url: 'https://huggingface.co/lxfater/inpaint-web/resolve/main/migan.onnx',
  },
  {
    name: 'model-perf',
    url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan.onnx',
  },
  {
    name: 'migan-pipeline-v2',
    url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
  },
]
const currentModel = modelList[2]
const key = currentModel.name
const { url } = currentModel
localforage.config({
  name: 'modelCache',
})

export async function saveModel(modelBlob: ArrayBuffer) {
  await localforage.setItem(key, modelBlob)
}

export async function loadModel(): Promise<ArrayBuffer> {
  const model = (await localforage.getItem(key)) as ArrayBuffer
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
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  await saveModel(buffer)
  return buffer
}
