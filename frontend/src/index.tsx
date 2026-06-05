import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
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
    <App />
  </React.StrictMode>
)
