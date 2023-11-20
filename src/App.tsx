/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/outline'
import React, { useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Modal from './components/Modal'
import Editor from './Editor'
import { resizeImageFile } from './utils'
import useDownload from './adapters/use_download'
import Progress from './components/Progress'

function App() {
  const [file, setFile] = useState<File>()
  const [showAbout, setShowAbout] = useState(false)
  const modalRef = useRef(null)
  const { downloadProgress, downloaded, showAlert } = useDownload()

  useClickAway(modalRef, () => {
    setShowAbout(false)
  })

  async function startWithDemoImage(img: string) {
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
            setFile(undefined)
          }}
        >
          <span className="hidden sm:inline">Start new</span>
        </Button>

        <div style={{ fontSize: '36px' }}>Inpaint-web</div>
        <Button
          className="hidden sm:flex"
          icon={<InformationCircleIcon className="w-6 h-6" />}
          onClick={() => {
            setShowAbout(true)
          }}
        >
          <p>反馈/feedback</p>
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
                  const { file: resizedFile } = await resizeImageFile(f, 1024)
                  setFile(resizedFile)
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row pt-10 items-center justify-center cursor-pointer">
              <span className="text-gray-500">
                试一试:
                <br />
                Try it:
              </span>
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
              {' '}
              任何问题到:{' '}
              <a
                href="https://github.com/lxfater/inpaint-web"
                style={{ color: 'blue' }}
              >
                Inpaint-web
              </a>{' '}
              反馈
            </p>
            <p>
              {' '}
              For any questions, please go to:{' '}
              <a
                href="https://github.com/lxfater/inpaint-web"
                style={{ color: 'blue' }}
              >
                Inpaint-web
              </a>{' '}
              to provide feedback.
            </p>
          </div>
        </Modal>
      )}

      {showAlert && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5">
            <p>
              {' '}
              本项目仅在支持WEBGPU的环境下运行, 也就是说你要安装最新版本的Chrome
            </p>
            <p>
              {' '}
              This project only runs in environments that support WEBGPU,
              meaning you need to install the latest version of Chrome.{' '}
            </p>
          </div>
        </Modal>
      )}
      {!downloaded && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5">
            <p>
              {' '}
              需要下载一次30MB大小模型文件,耐心等待。。。 首次使用比较慢。。。
            </p>
            <p>
              {' '}
              Need to download a 30MB model file, please wait patiently... The
              first use might be slow...{' '}
            </p>
            <Progress percent={downloadProgress} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default App
