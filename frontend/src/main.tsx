import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const theme = localStorage.getItem('theme');
document.documentElement.classList.toggle('light', theme === 'light');
document.documentElement.classList.toggle('dark', theme !== 'light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
