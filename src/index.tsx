import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './App'
import { loadingOnnxruntime } from './adapters/util'

loadingOnnxruntime()

ReactDOM.render(<App />, document.getElementById('root'))
