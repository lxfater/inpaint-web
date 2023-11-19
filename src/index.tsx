import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './App'
import 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.2/dist/ort.webgpu.min.js'

ReactDOM.render(<App />, document.getElementById('root'))
