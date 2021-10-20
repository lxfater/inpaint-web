import { FirebaseApp, initializeApp } from 'firebase/app'
import {
  AppCheck,
  AppCheckTokenResult,
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check'
import { Analytics, getAnalytics, logEvent } from 'firebase/analytics'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAMvBh0_iWj0wnPW8YUbM6ARSouYL7Iw4M',
  authDomain: 'cleanup-pictures.firebaseapp.com',
  projectId: 'cleanup-pictures',
  storageBucket: 'cleanup-pictures.appspot.com',
  messagingSenderId: '779551806082',
  appId: '1:779551806082:web:b30ce45c5c661bd3f59a9b',
  measurementId: 'G-3Y6G6H20DD',
}

interface Firebase {
  app: FirebaseApp
  appCheck: AppCheck
  analytics: Analytics
  logEvent: (event: string, data?: any) => void
  getAppCheckToken: () => Promise<AppCheckTokenResult>
}

const FirebaseContext = createContext<Firebase | undefined>(undefined)

interface Props {
  children: ReactNode
}

export default function FirebaseProvider(props: Props) {
  const { children } = props
  const [state, setState] = useState<Firebase>()

  useEffect(() => {
    const app = initializeApp(firebaseConfig)
    const analytics = getAnalytics(app)

    const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY
    if (!recaptchaSiteKey) {
      throw new Error('missing env REACT_APP_RECAPTCHA_SITE_KEY')
    }

    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),

      // Optional argument. If true, the SDK automatically refreshes App Check
      // tokens as needed.
      isTokenAutoRefreshEnabled: true,
    })

    setState({
      app,
      appCheck,
      analytics,
      logEvent: (event: string, data?: any) => {
        if (IS_DEV) {
          // eslint-disable-next-line
          console.log('Analytics Debug:', event, data)
        }
        logEvent(analytics, event, data)
      },
      getAppCheckToken: () => getToken(appCheck),
    })
  }, [])

  return (
    <FirebaseContext.Provider value={state}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
