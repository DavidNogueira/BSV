import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler
} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { Setup, sdk } from '@bsv/wallet-toolbox'
import { createAuthMiddleware, AuthRequest } from '@bsv/auth-express-middleware'
import { PubKeyHex, VerifiableCertificate } from '@bsv/sdk'

//Added
dotenv.config()

const app = express()
app.use(bodyParser.json())

//~ DONE: Instantiate a BSV wallet to manage transactions
// Hint: Use PrivateKey.fromHex with the key '055d459c8d7cba2f8d22155093beb97848cf6b903f3af0a3c4eb45bac2dc236e' and create a Wallet instance
// Note: In production, load the key from a .env file using dotenv

async function main() {
  const rootKeyHex = process.env.SERVER_PRIVATE_KEY || '055d459c8d7cba2f8d22155093beb97848cf6b903f3af0a3c4eb45bac2dc236e'
  const wallet = await Setup.createWalletClientNoEnv({ chain: 'test', rootKeyHex })

// ~ DONE: Configure the Auth middleware
// Hint: Use createAuthMiddleware with the wallet and set allowUnauthenticated to false
  const authMiddleware = createAuthMiddleware({ wallet, allowUnauthenticated: false })

// ~ DONE: Enable CORS for frontend-backend communication
// Hint: Add middleware to set Access-Control-Allow-* headers (Origin, Headers, Methods, Expose-Headers, Private-Network) and handle OPTIONS requests with a 200 status
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.set('Access-Control-Expose-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Allow-Private-Network', 'true')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
  })

// ~ DONE: Apply the auth middleware to all routes
// Hint: Use app.use() with the authMiddleware
  app.use(authMiddleware as RequestHandler)

// TODO: Configure a non-protected route
// Hint: Create a GET route for '/' that sends a "Hello, world!" response

// TODO: Configure a protected route
// Hint: Create a GET route for '/protected' that sends a greeting with req.auth.identityKey if authenticated, or a 401 "Unauthorized" response

// TODO: Start the server on port 3000
// Hint: Use app.listen() and log "Server is running on port 3000"
app.listen(3000)
}

main()
