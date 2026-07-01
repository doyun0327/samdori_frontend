import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSamdoriPushBridge } from './utils/samdoriPushContext'
import './index.css'
import App from './App.jsx'

initSamdoriPushBridge()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
