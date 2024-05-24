import localforage from 'localforage'

export type modelType = 'inpaint' | 'superResolution' | 'superPhi'

localforage.config({
  name: 'modelCache',
})

export async function saveModel(modelType: modelType, modelBlob: ArrayBuffer) {
  await localforage.setItem(getModel(modelType).name, modelBlob)
}

function getModel(modelType: modelType) {
  if (modelType === 'inpaint') {
    const modelList = [
      {
        name: 'model',
        url: 'https://huggingface.co/lxfater/inpaint-web/resolve/main/migan.onnx',
        backupUrl: '',
      },
      {
        name: 'model-perf',
        url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan.onnx',
        backupUrl: '',
      },
      {
        name: 'migan-pipeline-v2',
        url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
        backupUrl:
          'https://worker-share-proxy-01f5.lxfater.workers.dev/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
      },
    ]
    const currentModel = modelList[2]
    return currentModel
  }
  /*
  2xHFA2kAVCSRFormer_light

  Name: 2xHFA2kAVCSRFormer_light
  License: CC BY 4.0
  Network: SRFormer_light
  Scale: 2
  Purpose: 2x anime upscaling model that handles AVC (h264) compression
  Iterations: 140000
  batch_size: 2-4
  HR_size: 128-192
  Dataset: HFA2k_h264
  Number of train images: 2568
  OTF Training: No
  Pretrained_Model_G: SRFormerLight_SRx2_DIV2K.pth
    */
  // mediumResolution - https://github.com/Phhofm/models/blob/main/2xHFA2kAVCSRFormer_light/onnx/2xHFA2kAVCSRFormer_light_16_onnxsim_fp32.onnx
    if (modelType === 'mediumResolution') {
    const modelList = [
      {
        name: '2xHFA2kAVCSRFormer_light_16_onnxsim_fp32',
        url: '/models/2xHFA2kAVCSRFormer_light_16_onnxsim_fp32.onnx',
        backupUrl:
          '',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  // GoodPerf -- 2xEvangelion_omnisr_fp32_opset17.onnx
  /*
  Name: 2xEvangelion_omnisr
License: CC BY 4.0
Google Drive
Release Date: 08.02.2024 (dd/mm/yy)
Author: Philip Hofmann
Network: OmniSR
Scale: 2
Purpose: 2x upscaler for evangelion episodes
Iterations: 218'000
epoch: 198
batch_size: 12-32
HR_size: 128-256
Dataset: "Upscale Archive Evangelion DVD's" by pwnsweet
Number of train images: 3174
OTF Training: No
Pretrained_Model_G: 2xHFA2kOmniSR
*/
  if (modelType === 'speedResolution') {
    const modelList = [
      {
        name: '2xEvangelion_omnisr_fp32_opset17.onnx',
        url: '/models/2xEvangelion_omnisr_fp32_opset17.onnx',
        backupUrl:
          '',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  // hight -- https://github.com/Phhofm/models/raw/main/2xHFA2kAVCSRFormer_light/onnx/2xHFA2kAVCSRFormer_light_64_onnxsim_fp32.onnx
    if (modelType === 'hightResolution') {
    const modelList = [
      {
        name: '2xHFA2kAVCSRFormer_light_64_onnxsim_fp32.onnx',
        url: '/models/2xHFA2kAVCSRFormer_light_64_onnxsim_fp32.onnx',
        backupUrl:
          '',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  if (modelType === 'superResolution') {
    const modelList = [
      {
        name: 'realesrgan-x4',
        url: 'https://huggingface.co/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx',
        backupUrl:
          'https://worker-share-proxy-01f5.lxfater.workers.dev/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  if (modelType === 'superPhi') {
    const modelList = [
      {
        // name: 'phi3-mini-128k-instruct-cuda-int4-rtn-block-32',
        // public/assets/super_resolution.onnx
        // url: 'https://huggingface.co/microsoft/Phi-3-mini-128k-instruct-onnx/resolve/main/cuda/cuda-int4-rtn-block-32/phi3-mini-128k-instruct-cuda-int4-rtn-block-32.onnx',
        name: 'model',
        url: 'https://huggingface.co/ssube/stable-diffusion-x4-upscaler-onnx/resolve/main/vae/model.onnx',  
        backupUrl:'',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  // name: input  - tensor: float32[1,3,256,256]
  // name: output - tensor: float32[1,3,256,256]
  if (modelType === 'superFace') {
    const modelList = [
      {
        name: 'GPEN-BFR-256',
        url: 'https://huggingface.co/netrunner-exe/Face-Upscalers-onnx/resolve/main/GPEN-BFR-256.onnx',  
        // backupUrl:'https://huggingface.co/netrunner-exe/Face-Upscalers-onnx/blob/main/GPEN-BFR-256.fp16.onnx',
        backupUrl:'',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  // https://huggingface.co/netrunner-exe/Face-Upscalers-onnx/blob/main/GPEN-BFR-512.onnx
  if (modelType === 'hyperFace') {
    const modelList = [
      {
        // name: 'GFPGANv1.2.fp16',
        // url: 'https://huggingface.co/netrunner-exe/Face-Upscalers-onnx/resolve/main/GFPGANv1.2.fp16.onnx?download=true',  
        name: 'model',
        url: 'https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/vae_decoder/model.onnx?download=true', 
        // backupUrl:'https://huggingface.co/netrunner-exe/Face-Upscalers-onnx/blob/main/GPEN-BFR-256.fp16.onnx',
        backupUrl:'',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  // https://huggingface.co/Rookiehan/facefusion/blob/main/face_occluder.onnx
  /* https://huggingface.co/uwg/upscaler/tree/main/Face_Restore/FaceFusion
  in_face:0 - name: in_face:0 tensor: float32[unk__359,256,256,3]
  out_mask:0 - name: out_mask:0 tensor: float32[unk__360,256,256,1]

  https://huggingface.co/bluefoxcreation/Face-Occluder-ONNX
  input - name: input - tensor: float32[batch_size,3,?,?]
  output - name: output - tensor: float32[batch_size,1,?,?]
  */
  if (modelType === 'occluderFace') {
    const modelList = [
      {
        name: 'occluder',
        url: 'https://huggingface.co/bluefoxcreation/Face-Occluder-ONNX/resolve/main/occluder.onnx?download=true',
        backupUrl:'',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  throw new Error('wrong modelType')
}

export async function loadModel(modelType: modelType): Promise<ArrayBuffer> {
  const model = (await localforage.getItem(
    getModel(modelType).name
  )) as ArrayBuffer
  return model
}

export async function modelExists(modelType: modelType) {
  const model = await loadModel(modelType)
  return model !== null && model !== undefined
}

export async function ensureModel(modelType: modelType) {
  if (await modelExists(modelType)) {
    return loadModel(modelType)
  }
  const model = getModel(modelType)
  const response = await fetch(model.url)
  const buffer = await response.arrayBuffer()
  await saveModel(modelType, buffer)
  return buffer
}

export async function downloadModel(
  modelType: modelType,
  setDownloadProgress: (arg0: number) => void
) {
  if (await modelExists(modelType)) {
    return
  }

  async function downloadFromUrl(url: string) {
    console.log('start download from', url)
    setDownloadProgress(0)
    const response = await fetch(url)
    const fullSize = response.headers.get('content-length')
    const reader = response.body!.getReader()
    const total: Uint8Array[] = []
    let downloaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      downloaded += value?.length || 0

      if (value) {
        total.push(value)
      }

      setDownloadProgress((downloaded / Number(fullSize)) * 100)
    }

    const buffer = new Uint8Array(downloaded)
    let offset = 0
    for (const chunk of total) {
      buffer.set(chunk, offset)
      offset += chunk.length
    }

    await saveModel(modelType, buffer)
    setDownloadProgress(100)
  }

  const model = getModel(modelType)
  try {
    await downloadFromUrl(model.url)
  } catch (e) {
    if (model.backupUrl) {
      try {
        await downloadFromUrl(model.backupUrl)
      } catch (r) {
        alert(`Failed to download the backup model: ${r}`)
      }
    }
    alert(`Failed to download the model, network problem: ${e}`)
  }
}
