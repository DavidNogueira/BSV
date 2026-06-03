import React, { useEffect, useState } from 'react'
import {
  initializeClient,
  getMyIdentityKey,
  sendMessage,
  listMessages,
  acknowledgeMessages
} from './messageBoxClient'

// Define the structure of a PeerMessage
interface PeerMessage {
  messageId: string
  sender: string
  body: string | Record<string, any>
}

let hasComponentRemount = false

export default function App() {
  const [recipient, setRecipient] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messages, setMessages] = useState<PeerMessage[]>([])
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([])
  const [identityKey, setIdentityKey] = useState<string | null>(null)

  useEffect(() => {
    // Initialize the MessageBoxClient and fetch identity key
    const init = async () => {
      try {
        await initializeClient()
        const key = await getMyIdentityKey()
        setIdentityKey(key)
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }
    init()
  }, [])

  const handleSend = async () => {
    try {
      if (!recipient || !messageBody) {
        alert('Recipient and Message Body are required.')
        return
      }
      await sendMessage(recipient, messageBody)
      alert('Message sent successfully!')
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send message.')
    }
  }

  const handleListMessages = async () => {
    try {
      // TODO: Implement the logic to list messages with the following requirements:
      // - Call the listMessages function to retrieve messages
      // - Update the messages state with the retrieved messages
      // - If an error occurs, catch it, log it to the console with the prefix "List messages error:", and show an alert with the message "Failed to list messages."
      const msgs = await listMessages() //Adicionei
      setMessages(msgs)
    } catch (error) {
      console.error('List messages error:', error)
      alert('Failed to list messages.')
    }
  }

  const handleAcknowledge = async () => {
    try {
      // TODO: Implement the logic to acknowledge messages with the following requirements:
      // - Validate that selectedMessageIds is not empty; if empty, show an alert with the message "Please select messages to acknowledge." and return early
      // - Call the acknowledgeMessages function with selectedMessageIds as the argument
      // - If successful, show an alert with the message "Messages acknowledged!"
      // - Refresh the inbox by calling handleListMessages
      // - If an error occurs, catch it, log it to the console with the prefix "Acknowledge error:", and show an alert with the message "Failed to acknowledge messages."
      if (selectedMessageIds.length === 0) {
        //Adicionei
        alert('Please select messages to acknowledge.')
        return
      }
      await acknowledgeMessages(selectedMessageIds)
      alert('Messages acknowledged!')
      await handleListMessages()
    } catch (error) {
      console.error('Acknowledge error:', error)
      alert('Failed to acknowledge messages.')
    }
  }

  const toggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    )
  }

  //Adicionei
  if (identityKey === null) {
    return <p>Fetching identity key...</p>
  }

  return (
    // TODO: Add a loading indicator while the identity key is being fetched:
    // - If identityKey is null, render a <p> element with the text "Fetching identity key..."
    // - Otherwise, render the full UI below
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Lab L-3 Implementing a Basic Messaging Application</h1>

      <p>
        <strong>Your Identity Key:</strong>
        <br />
        {identityKey ?? 'Loading...'}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label>Recipient Identity Key:</label>
        <br />
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Enter recipient public key"
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Message Body:</label>
        <br />
        <textarea
          value={messageBody}
          onChange={e => setMessageBody(e.target.value)}
          placeholder="Enter message"
          style={{ width: '100%', height: '100px', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleSend} style={{ marginRight: '1rem' }}>
          Send Message
        </button>
        <button onClick={handleListMessages} style={{ marginRight: '1rem' }}>
          List Messages
        </button>
        <button onClick={handleAcknowledge}>Acknowledge Selected</button>
      </div>

      <h2>Inbox</h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul>
          {messages.map(msg => (
            <li key={msg.messageId} style={{ marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={selectedMessageIds.includes(msg.messageId)}
                onChange={() => toggleSelectMessage(msg.messageId)}
                style={{ marginRight: '0.5rem' }}
              />
              <strong>From:</strong> {msg.sender}
              <br />
              <strong>Message:</strong>{' '}
              {typeof msg.body === 'string'
                ? msg.body
                : JSON.stringify(msg.body)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
