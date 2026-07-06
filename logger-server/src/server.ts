import express, { Express, RequestHandler } from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { Setup, sdk } from '@bsv/wallet-toolbox'
import { EventLogger, EventLogResult } from './EventLogger.js'

// Load env variables
dotenv.config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || ''
const WALLET_STORAGE_URL =
  process.env.WALLET_STORAGE_URL || 'https://storage.babbage.systems'
const BSV_NETWORK = process.env.BSV_NETWORK || 'main'

interface LogEventRequest {
  eventData: Record<string, any>
}

interface LogEventResponse {
  txid: string
  message: string
}

const app: Express = express()
const port = process.env.PORT || 3000

async function initialize() {
  //~ DONE 1: Initialize BSV wallet
  const wallet = await Setup.createWalletClientNoEnv({
    chain: BSV_NETWORK as sdk.Chain,
    rootKeyHex: SERVER_PRIVATE_KEY,
    storageUrl: WALLET_STORAGE_URL
  })

  //~ DONE 2: Create EventLogger instance
  const eventLogger = new EventLogger(wallet)
  //~ DONE 3: Configure body-parser middleware
  app.use(bodyParser.json())

  //~ DONE 4: Set up CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    )

    next()
  })
  //~ DONE 5: Implement /log-event POST endpoint
  app.post('/log-event', async (req, res) => {
    try {
      const { eventData } = req.body as LogEventRequest
      const { txid, message } = await eventLogger.logEvent(eventData)
      res.status(201).json({ txid, message })
    } catch (err) {
      console.error('Error logging event:', err)
      res.status(500).json({ error: 'Failed to log event' })
    }
  })
  //~ DONE 6: Implement /retrieve-logs GET endpoint
  app.get('/retrieve-logs', async (req, res) => {
    try {
      const logs = await eventLogger.retrieveLogs()
      // res.json(logs)
      console.log('Retrieved logs:', logs)
      res.status(200).json({ logs })
    } catch (err) {
      console.error('Error retrieving logs:', err)
      res.status(500).json({ error: 'Failed to retrieve logs' })
    }
  })
  //~ DONE 7: Start the Express server
  app.listen(port, () => {
    console.log(`Logger server is running on http://localhost:${port}`)
  })
}

initialize().catch(err => {
  console.error('Failed to initialize backend wallet:', err)
  process.exit(1)
})
