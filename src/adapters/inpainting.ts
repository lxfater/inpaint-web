import { dataURItoBlob } from '../utils'

export default async function inpaint(
  imageFile: File,
  maskBase64: string,
  appCheckToken: string
) {
  const fd = new FormData()
  fd.append('image_file', imageFile)
  const mask = dataURItoBlob(maskBase64)
  fd.append('mask_file', mask)

  if (!process.env.REACT_APP_INPAINTING_ENDPOINT) {
    throw new Error('missing env var REACT_APP_INPAINTING_ENDPOINT')
  }
  const res = await fetch(process.env.REACT_APP_INPAINTING_ENDPOINT, {
    method: 'POST',
    headers: { 'X-Firebase-AppCheck': appCheckToken },
    body: fd,
  }).then(async r => {
    return r.blob()
  })

  return URL.createObjectURL(res)
}
