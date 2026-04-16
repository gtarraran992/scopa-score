import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import './index.css'
import App from './App.jsx'

const savedTheme = localStorage.getItem('scopa-theme')
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme)
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'green')
}

// Inizializza GoogleAuth dopo che il DOM è pronto
window.addEventListener('load', () => {
  GoogleAuth.initialize({
    clientId: '230215197989-3s5oi84a5lem4la4ogqrod55ng1uibar.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)