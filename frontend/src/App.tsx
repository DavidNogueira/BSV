import React from 'react'
import generatePresentationKey from './helpFunctions/generatePresentationKey'
import { createTransaction } from './createTx'

let hasComponentRemount = false
const App: React.FC = () => {
  //! const priv = import.meta.env.VITE_DEV_PRIVATE_KEY as string

  const [errorMessage, setErrorMessage] = React.useState('')
  React.useEffect(() => {
    //? We use a flag (hasComponentRemount) to ensure that the transaction creation function is only called once when the app starts. This prevents multiple transactions from being created if the component re-renders for any reason, which is important for debugging and ensuring that we don't create unintended transactions.
    if (hasComponentRemount) return
    hasComponentRemount = true
    //? Call the transaction creation function when the app starts
    createTransaction()
      .then(() => {
        console.log('Transaction created successfully')
      })
      .catch(error => {
        setErrorMessage(error)
        console.error('Failed to create transaction:', error)
      })
  }, [])

  //? We can generate the presentation key using the generatePresentationKey function 
  //! generatePresentationKey(priv)
  //!   .then(key => console.log('presentational key', key))
  //!   .catch(console.error)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Lab L-1 Creating a Transaction</h1>
      <p>
        Your transaction creation will be logged to the console (F12 to open).
      </p>
      {errorMessage && <div>{`${errorMessage}`}</div>}
    </div>
  )
}

export default App
