import axios from 'axios'
import * as FormData from 'form-data'
import * as functions from 'firebase-functions'
import * as express from 'express'
import { NextFunction, Request, Response } from 'express'
import * as cors from 'cors'
// @ts-ignore
import { fileParser } from 'express-multipart-file-parser'

// eslint-disable-next-line
const firebaseAdmin = require('firebase-admin')

const CLEANUP_ENDPOINT = functions.config().cleanup.endpoint

const app = express()
app.use(cors({ origin: true }))

const fileParserMiddleware = fileParser({
  rawBodyOptions: {
    limit: '10mb',
  },
})

firebaseAdmin.initializeApp()

const verifyAppCheckToken = async (appCheckToken: string | undefined) => {
  if (!appCheckToken) {
    functions.logger.info('no app check token')
    return null
  }
  try {
    return firebaseAdmin.appCheck().verifyToken(appCheckToken)
  } catch (err) {
    functions.logger.error('error verifying app check token')
    return null
  }
}
const appCheckVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appCheckClaims = await verifyAppCheckToken(
    req.header('X-Firebase-AppCheck')
  )
  if (!appCheckClaims) {
    res.status(401)
    return next('Unauthorized')
  }
  next()
}

app.post(
  '/cleanup',
  appCheckVerification,
  fileParserMiddleware,
  async (request, response) => {
    const fd = new FormData()
    // @ts-ignore
    const imageFile = request.files.find(f => f.fieldname === 'image_file')
    fd.append('image_file', imageFile.buffer, {
      contentType: imageFile.mimetype,
      filename: 'image.png',
    })
    // @ts-ignore
    const maskFile = request.files.find(f => f.fieldname === 'mask_file')
    fd.append('mask_file', maskFile.buffer, {
      contentType: maskFile.mimetype,
      filename: 'mask.png',
    })

    try {
      const result = await axios.post(CLEANUP_ENDPOINT, fd, {
        headers: fd.getHeaders(),
        responseType: 'arraybuffer',
      })
      response.set('Content-Type', 'image/png')
      return response.send(result.data)
    } catch (e) {
      functions.logger.error(e, { structuredData: true })
      response.statusCode = 500
      return response.send(e)
    }
  }
)

const api = functions.https.onRequest(app)
export default api
