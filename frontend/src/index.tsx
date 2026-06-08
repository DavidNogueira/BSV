// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// // import { initializeClient } from './messageBoxClient'

// // // Initialize the MessageBoxClient when the app starts
// // initializeClient()
// //   .then(() => {
// //     console.log('MessageBoxClient initialized successfully')
// //   })
// //   .catch(error => {
// //     console.error('Failed to initialize MessageBoxClient:', error)
// //   })

// // Render the React app
// const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

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
  // TODO: Add fallback rendering in case the root element is missing:
  // - Create a new div element with document.createElement('div')
  // - Set its style to { padding: '2rem', fontFamily: 'Arial, sans-serif' }
  // - Set its innerHTML to include an <h1> with the text "Initialization Error" and a <p> with the text "Root element not found. Please check your index.html."
  // - Append the div to document.body
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
