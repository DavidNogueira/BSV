import React from 'react'
import generatePresentationKey from './helpFunctions/generatePresentationKey'

const App: React.FC = () => {
  const priv = import.meta.env.VITE_DEV_PRIVATE_KEY as string;

    generatePresentationKey(priv).then(console.log).catch(console.error)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Lab L-1 Creating a Transaction</h1>
      <p>
        Your transaction creation will be logged to the console (F12 to open).
      </p>
    </div>
  )
}

export default App
