import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import App from './App'
import web3Theme from './theme'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const rootElement = document.getElementById('root') as HTMLElement
if (!rootElement) {
  //~ DONE: Add fallback rendering in case the root element is missing:
  //~ - Create a new div element with document.createElement('div')
  //~ - Set its style to { padding: '2rem', fontFamily: 'Arial, sans-serif' }
  //~ - Set its innerHTML to include an <h1> with the text "Initialization Error" and a <p> with the text "Root element not found. Please check your index.html."
  //~ - Append the div to document.body
  //? NOTE: If #root is missing, the app simply fails. Anything beyond that is mostly theater.
  const errorDiv = document.createElement('div')
  errorDiv.style.padding = '2rem'
  errorDiv.style.fontFamily = 'Arial, sans-serif'
  errorDiv.innerHTML = `
    <h1>Initialization Error</h1>
    <p>Root element not found. Please check your index.html.</p>
  `
  document.body.appendChild(errorDiv)
} else {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <ThemeProvider theme={web3Theme}>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}
