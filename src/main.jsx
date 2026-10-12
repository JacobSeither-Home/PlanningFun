import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/limelight'
import '@fontsource-variable/jost'
import './styles.css'
import App from './App'
import { applyAppearance, loadAppearance } from './lib/theme'

applyAppearance(loadAppearance())

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
