import React, { useEffect, useState } from 'react'
import { modelExists, saveModel } from './cache'

const useDownload = () => {
  const [downloadProgress, setDownloadProgress] = useState(100)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    download()
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function checkGpu() {
    setShowAlert(
      // @ts-ignore
      !navigator?.gpu && !(await navigator.gpu?.requestAdapter())
    )
    return !showAlert
  }

  async function download() {
    if (await checkGpu()) {
      if (await modelExists()) {
        return
      }
      console.log('start download')
      setDownloadProgress(0)

      const response = await fetch(
        'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx'
      )
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

      await saveModel(buffer)
      setDownloadProgress(100)
    }
  }

  return { showAlert, downloadProgress, downloaded: downloadProgress === 100 }
}

export default useDownload
