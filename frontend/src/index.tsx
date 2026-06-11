import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// NEW: Import MUI ThemeProvider and your custom theme
import { ThemeProvider, CssBaseline } from '@mui/material'
import web3Theme from './Utils/theme'

const rootElement = document.getElementById('root')
if (!rootElement) {
  // TODO: Add a development safeguard if the root element is missing:
  // - Create a new div element with document.createElement('div')
  // - Set its innerHTML to include an <h1> with the text "Missing Root Element" and a <p> with the text "The root element was not found. Please check your index.html."
  // - Append the div to document.body
  // - Throw an error with the message "Root element not found" to halt execution
  throw new Error('Root element not found')
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={web3Theme}>
      <CssBaseline /> {/* Ensures consistent baseline styles for dark mode */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
