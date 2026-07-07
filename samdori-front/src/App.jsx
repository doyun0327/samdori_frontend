import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { AppAlertProvider } from './context/AppAlertContext'

function App() {
  return (
    <BrowserRouter>
      <AppAlertProvider>
        <AppRoutes />
      </AppAlertProvider>
    </BrowserRouter>
  )
}

export default App
