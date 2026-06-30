import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler
} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { createAuthMiddleware, AuthRequest } from '@bsv/auth-express-middleware'
import { Setup, sdk } from '@bsv/wallet-toolbox'
dotenv.config()

//Added
dotenv.config()
const app = express()
app.use(bodyParser.json())

//~ DONE: Instantiate a BSV wallet to manage transactions
// Hint: Use PrivateKey.fromHex with the key 'XXXX' and create a Wallet instance
// Note: In production, load the key from a .env file using dotenv
async function main() {
  const rootKeyHex = process.env.SERVER_PRIVATE_KEY || ''
  const wallet = await Setup.createWalletClientNoEnv({
    chain: 'test',
    rootKeyHex
  })

  

  // Configure the Auth middleware
  const authMiddleware = createAuthMiddleware({
    wallet: wallet,
    allowUnauthenticated: false
  })

  // Enable CORS for frontend-backend communication
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.set('Access-Control-Expose-Headers', '*')
    res.set('Access-Control-Allow-Private-Network', 'true')

    if (req.method === 'OPTIONS') {
      res.status(200).end()
    } else {
      next()
    }
  })

  // Apply the auth middleware to all routes
  app.use(authMiddleware)

  // Configure a non-protected route
  app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!')
  })

  // Configure a protected route
  app.get('/protected', (req: AuthRequest, res: Response) => {
    if (req.auth && req.auth.identityKey) {
      res.json({ message: `Hello, ${req.auth.identityKey}!` })
    } else {
      res.status(401).json({ error: 'Unauthorized' })
    }
  })

  // Start the server on port 3000
  app.listen(3000, () => {
    console.log('Server is running on port 3000')
  })
}
main()
