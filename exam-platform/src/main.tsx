import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/** Eski versiyada JWT localStorage’da saqlangan; endi faqat HTTPOnly cookie */
try {
  localStorage.removeItem('token')
} catch {
  /* */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
