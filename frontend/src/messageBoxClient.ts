import { MessageBoxClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

const MESSAGEBOX_HOST = 'https://messagebox.babbage.systems'

// Hold the initialized clients
let client: MessageBoxClient
let walletClient: WalletClient

/**
 * Initializes the MessageBoxClient and WalletClient for use.
 */
export async function initializeClient() {
  try {
    console.log('[initializeClient] Creating WalletClient...')
    // TODO: Initialize the WalletClient with the following requirements:
    // - Use the 'json-api' type and 'localhost' as the host
    // - Assign the instance to the walletClient variable
    walletClient = new WalletClient('json-api', 'localhost') // Replace this line in your TODO section

    console.log('[initializeClient] Creating MessageBoxClient...')
    client = new MessageBoxClient({
      host: MESSAGEBOX_HOST,
      networkPreset: 'mainnet',
      walletClient,
      enableLogging: true,
    })

    console.log('[initializeClient] Initializing MessageBoxClient...')
    await client.init()
    console.log('[initializeClient] MessageBoxClient initialized successfully.')
  } catch (error) {
    console.error('[initializeClient] Failed:', error)
    throw error
  }
}

/**
 * Fetches the user's public identity key.
 */
export async function getMyIdentityKey(): Promise<string> {
  try {
    console.log('[getMyIdentityKey] Fetching public identity key...')
    const { publicKey } = await walletClient.getPublicKey({ identityKey: true })
    console.log('[getMyIdentityKey] Fetched identity key:', publicKey)
    return publicKey
  } catch (error) {
    console.error('[getMyIdentityKey] Failed to fetch identity key:', error)
    throw error
  }
}

/**
 * Sends a message to a given recipient identity key.
 * @param recipient The public identity key of the recipient
 * @param body The body of the message to send
 */
export async function sendMessage(recipient: string, body: string) {
  try {
    console.log('[sendMessage] Sending message to:', recipient)
    // TODO: Send a message with the following requirements:
    // - Use the client.sendMessage method
    // - Set the recipient to the provided recipient parameter
    // - Use 'L3_inbox' as the messageBox
    // - Set the body to the provided body parameter
    await client.sendMessage({ recipient, messageBox: 'L3_inbox', body })//Adicionei
    console.log('[sendMessage] Message sent successfully.')
  } catch (error) {
    console.error('[sendMessage] Failed to send message:', error)
    throw error
  }
}

/**
 * Lists incoming messages from the configured inbox.
 */
export async function listMessages() {
  try {
    console.log('[listMessages] Listing messages from inbox...')
    const messages = await client.listMessages({ messageBox: 'L3_inbox' })
    console.log('[listMessages] Messages retrieved:', messages.length)
    return messages
  } catch (error) {
    console.error('[listMessages] Failed to list messages:', error)
    throw error
  }
}

/**
 * Acknowledges a list of message IDs to remove them from the inbox.
 * @param messageIds An array of message IDs to acknowledge
 */
export async function acknowledgeMessages(messageIds: string[]) {
  try {
    console.log('[acknowledgeMessages] Acknowledging messages:', messageIds)
    await client.acknowledgeMessage({ messageIds })
    console.log('[acknowledgeMessages] Messages acknowledged successfully.')
  } catch (error) {
    console.error('[acknowledgeMessages] Failed to acknowledge messages:', error)
    throw error
  }
}