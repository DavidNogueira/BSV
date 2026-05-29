import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Render the React app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// DONE: Render the App component in StrictMode using root.render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
