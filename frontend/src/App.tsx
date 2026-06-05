import React, { useState } from 'react'
import { createAndSubmitToken, queryToken } from './helloWorldToken'

let hasComponentRemount = false
export default function App() {
  const [message, setMessage] = useState('Hello Blockchain!')
  const [status, setStatus] = useState('')
  const [queryResult, setQueryResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAndSubmit = async () => {
    //? We use a flag (hasComponentRemount) to ensure that the transaction creation function is only called once when the app starts. This prevents multiple transactions from being created if the component re-renders for any reason, which is important for debugging and ensuring that we don't create unintended transactions.
    if (hasComponentRemount) return
    hasComponentRemount = true
    //~ DONE: Implement the logic to create and submit a token with the following requirements:
    //~ - Set isLoading to true at the start of the operation
    //~ - Update the status to "Creating and submitting token..."
    //~ - Call createAndSubmitToken with the message state
    //~ - If successful, update the status to "Token submitted successfully!"
    //~ - If an error occurs, log it to the console with the prefix "Token creation error:" and update the status to "Failed to create and submit token."
    //~ - Set isLoading to false in a finally block to ensure it’s reset after the operation
    try {
      setIsLoading(true)
      setStatus('Creating and submitting token...')
      await createAndSubmitToken(message)
      setStatus('Token submitted successfully!')
    } catch (error) {
      console.error('Token creation error:', error)
      setStatus('Failed to create and submit token.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuery = async () => {
    try {
      setIsLoading(true)
      setStatus('Querying token...')
      const result = await queryToken(message)
      setQueryResult(`Found token with message: ${result}`)
      setStatus('Token query successful!')
    } catch (error) {
      console.error('Token query error:', error)
      setStatus('Failed to query token.')
    } finally {
      setIsLoading(false)
    }
  }

  //~ DONE: Add a loading indicator while operations are in progress:
  //~ - If isLoading is true, render a <p> element with the text "Loading..." above the main UI
  //~ - Otherwise, render the full UI below
  if (isLoading === true) {
    return <p>Loading...</p>
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Lab L-4: Submitting and Querying Tokens with Overlay Services</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="messageInput">Message:</label>
        <br />
        <input
          id="messageInput"
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleCreateAndSubmit} style={{ marginRight: '1rem' }}>
          Create and Submit Token
        </button>
        <button onClick={handleQuery}>Query Token</button>
      </div>

      <div style={{ marginBottom: '1rem', color: 'gray' }}>{status}</div>

      {queryResult && (
        <div>
          <h3>Queried Token Message:</h3>
          <div>{queryResult}</div>
        </div>
      )}
    </div>
  )
}
