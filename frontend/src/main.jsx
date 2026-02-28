import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'
import App from './App'
import { ThemeProvider } from './providers/ThemeProvider'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
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
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>
)
