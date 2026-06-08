import { WERR_REVIEW_ACTIONS } from '@bsv/sdk'
import { createToken, queryTokens } from 'hello-tokens'

/**
 * Creates a "Hello World" token using the helper from hello-tokens.
 *
 * @param message The message to embed in the token (e.g., "Hello Blockchain!")
 * @throws {Error} If token creation or submission fails
 */
export async function createAndSubmitToken(message: string): Promise<void> {
  console.log('[createAndSubmitToken] Creating token with message:', message)

  //~ DONE: Implement the logic to create and submit a token with the following requirements:
  //~ - Use the createToken function from hello-tokens to create a token with the provided message
  //~ - Ensure the function awaits the token creation to handle asynchronous behavior
  //~ - Catch any errors and log them appropriately:
  //~   - If the error is an instance of WERR_REVIEW_ACTIONS, log the error with its properties (code, message, reviewActionResults, sendWithResults, txid, tx, noSendChange)
  //~   - If the error is a standard Error, log its message, name, stack, and the error object
  //~   - For unknown errors, log the error as-is
  //~ - If an error occurs, throw it to be handled by the calling function
  try {
    await createToken(message)
  } catch (error) {
    if (error instanceof WERR_REVIEW_ACTIONS) {
      console.error('Wallet threw WERR_REVIEW_ACTIONS:', {
        code: error.code,
        message: error.message,
        reviewActionResults: error.reviewActionResults,
        sendWithResults: error.sendWithResults,
        txid: error.txid,
        tx: error.tx,
        noSendChange: error.noSendChange
      })
    } else if (error instanceof Error) {
      console.error('Failed with error status:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    } else {
      console.error('Failed with unknown error:', error)
    }
    throw error
  }
}

/**
 * Queries the overlay for Hello World tokens containing the given message.
 *
 * @param originalMessage The message originally embedded (used as the query string)
 * @returns {Promise<string>} The first matching Hello World message if found
 * @throws {Error} If no tokens are found
 */
export async function queryToken(originalMessage: string): Promise<string> {
  console.log('[queryToken] Querying tokens with message:', originalMessage)

  //~ DONE: Implement the logic to query tokens with the following requirements:
  //~ - Use the queryTokens function from hello-tokens with a limit of 10 and the originalMessage as the message parameter
  //~ - Log the query results to the console
  //~ - If no results are found, log an error message and throw an Error with the message "No Hello World tokens found"
  //~ - Otherwise, log the first matched message and return it
  const tokens = await queryTokens({
    limit: 10,
    message: originalMessage
  })
  console.log('[queryToken] Found tokens:', tokens)

  if (tokens.length === 0) {
    console.error('[queryToken] No Hello World tokens found')
    throw new Error('No Hello World tokens found')
  }

  console.log('[queryToken] First matched message:', tokens[0])
  return tokens[0].message
}
