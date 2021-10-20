import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './App'
import FirebaseProvider from './adapters/firebase'

ReactDOM.render(
  <FirebaseProvider>
    <App />
  </FirebaseProvider>,
  document.getElementById('root')
)
