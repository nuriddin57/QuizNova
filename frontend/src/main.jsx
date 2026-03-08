import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import './i18n'
import App from './App'
import { ThemeProvider } from './providers/ThemeProvider'
import { AuthProvider } from './context/AuthContext'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster
            toastOptions={{
              style: {
                borderRadius: '1rem',
                padding: '1rem 1.5rem',
                background: '#14172b',
                color: '#fff',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
