import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'
import { darkTheme } from './theme'
// import { initializeClient } from './messageBoxClient'

// // Initialize the MessageBoxClient when the app starts
// initializeClient()
//   .then(() => {
//     console.log('MessageBoxClient initialized successfully')
//   })
//   .catch(error => {
//     console.error('Failed to initialize MessageBoxClient:', error)
//   })

// Render the React app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  </React.StrictMode>
)
