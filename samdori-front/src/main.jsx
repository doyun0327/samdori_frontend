import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSamdoriPushBridge } from './utils/samdoriPushContext'
import { restorePersistedAuthSession } from './utils/loginPersistence'
import './index.css'
import App from './App.jsx'

initSamdoriPushBridge()
restorePersistedAuthSession()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
