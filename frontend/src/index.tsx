import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createTransaction } from './createTx'

// Call the transaction creation function when the app starts
createTransaction()
  .then(() => {
    console.log('Transaction created successfully')
  })
  .catch(error => {
    console.error('Failed to create transaction:', error)
  })

// Render the React app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
// TODO: Render the App component in StrictMode using root.render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)