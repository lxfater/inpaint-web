import {
  ArrowLeftIcon,
  ChatAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import React, { useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { useFirebase } from './adapters/firebase'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Link from './components/Link'
import Logo from './components/Logo'
import MadeWidthBadge from './components/MadeWidthBadge'
import Modal from './components/Modal'
import Editor from './Editor'
import { resizeImageFile } from './utils'

function App() {
  const [file, setFile] = useState<File>()
  const [showAbout, setShowAbout] = useState(false)
  const modalRef = useRef(null)
  const firebase = useFirebase()

  useClickAway(modalRef, () => {
    setShowAbout(false)
  })

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="relative z-10 flex px-5 py-3 justify-between items-center sm:items-start">
        <Button
          className={[file ? '' : 'opacity-0 hidden sm:flex'].join(' ')}
          icon={<ArrowLeftIcon className="w-6 h-6" />}
          onClick={() => {
            firebase.logEvent('start_new')
            setFile(undefined)
          }}
        >
          <span className="hidden sm:inline">Start new</span>
        </Button>

        <Logo />
        <Button
          className="hidden sm:flex"
          icon={<InformationCircleIcon className="w-6 h-6" />}
          onClick={() => {
            firebase.logEvent('show_modal')
            setShowAbout(true)
          }}
        >
          About
        </Button>
      </header>

      <main className="h-full flex flex-1 flex-col items-center justify-center overflow-hidden">
        {file ? (
          <Editor file={file} />
        ) : (
          <>
            <div className="h-72 sm:w-1/2 max-w-5xl">
              <FileSelect
                onSelection={async f => {
                  const {
                    file: resizedFile,
                    resized,
                    originalWidth,
                    originalHeight,
                  } = await resizeImageFile(f, 1024)
                  firebase.logEvent('set_file', {
                    resized,
                    originalWidth,
                    originalHeight,
                  })
                  setFile(resizedFile)
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row pt-10 items-center justify-center cursor-pointer">
              <span className="text-gray-500">Or try with a test image:</span>
              <div className="flex space-x-2 sm:space-x-4 px-4">
                {['bag', 'jacket', 'table', 'shoe', 'paris'].map(image => (
                  <div
                    key={image}
                    onClick={() => startWithDemoImage(image)}
                    role="button"
                    onKeyDown={() => startWithDemoImage(image)}
                    tabIndex={-1}
                  >
                    <img
                      className="rounded-md hover:opacity-75"
                      src={`exemples/${image}.thumb.jpeg`}
                      alt={image}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {showAbout && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5">
            <p>
              Some photobomber ruined your selfie? There’s a ketchup stain on
              your shirt? You want to replace some text or graphic?
            </p>

            <p>
              <Link href="https://cleanup.pictures">CleanUp.pictures</Link> is a
              free web application that lets you cleanup your photos with a
              quick & simple interface.
            </p>

            <p>
              It uses <Link href="https://arxiv.org/abs/2109.07161">LaMa</Link>,
              an open-source model from Samsung’s AI Lab to automatically &
              acurately redraw the areas that you delete.
            </p>

            <p>
              <Link href="https://cleanup.pictures">CleanUp.pictures</Link> has
              been built by the engineering team at{' '}
              <Link href="https://clipdrop.co">ClipDrop</Link> and it&apos;s{' '}
              <Link href="https://github.com/initml/cleanup.pictures">
                open-source
              </Link>{' '}
              under the Apache License 2.0.
            </p>

            <p>
              If you have any question please{' '}
              <Link href="mailto:contact@clipdrop.co">contact us!</Link>
            </p>
          </div>
        </Modal>
      )}

      <footer
        className={[
          'absolute bottom-0 pl-7 pb-5 px-5 w-full flex justify-between',
          'pointer-events-none',
          // Hide footer when editing on mobile
          file ? 'hidden lg:flex' : '',
        ].join(' ')}
      >
        <a
          className="pointer-events-auto"
          href="https://clipdrop.co?utm_source=cleanup_pictures"
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            firebase.logEvent('click_clipdrop_badge')
          }}
        >
          <MadeWidthBadge />
        </a>

        <Button
          className="pointer-events-auto"
          icon={<ChatAltIcon className="w-6 h-6" />}
          onClick={() =>
            window.open('mailto:contact@cleanup.pictures', '_blank')
          }
        >
          Report issue
        </Button>
      </footer>
    </div>
  )
}

export default App
