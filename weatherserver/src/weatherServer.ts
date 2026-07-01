import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Setup, sdk } from "@bsv/wallet-toolbox";
import {
  createAuthMiddleware,
  AuthRequest,
} from "@bsv/auth-express-middleware";
import { PubKeyHex, VerifiableCertificate } from "@bsv/sdk";
// TODO 1: Import additional dependencies for payment processing
dotenv.config();
// TODO 2: Add crypto polyfill for payment processing

const {
  SERVER_PRIVATE_KEY = "055d459c8d7cba2f8d22155093beb97848cf6b903f3af0a3c4eb45bac2dc236e",
  WALLET_STORAGE_URL = "https://storage.babbage.systems",
  HTTP_PORT = "3001",
  CERTIFIER_IDENTITY_KEY = "0220529dc803041a83f4357864a09c717daa24397cf2f3fc3a5745ae08d30924fd",
  CERTIFICATE_TYPE_ID = "AGfk/WrT1eBDXpz3mcw386Zww2HmqcIn3uY6x4Af1eo=",
} = process.env;

type CertificateMap = Record<PubKeyHex, VerifiableCertificate[]>;
const CERTIFICATES_RECEIVED: CertificateMap = {};

async function init() {
  const app = express();
  const port = parseInt(HTTP_PORT, 10);

  app.use(bodyParser.json({ limit: "64mb" }));

  const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Expose-Headers", "*");
    res.header("Access-Control-Allow-Private-Network", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  };
  app.use(corsMiddleware);

  const wallet = await Setup.createWalletClientNoEnv({
    chain: "main" as sdk.Chain,
    rootKeyHex: SERVER_PRIVATE_KEY,
    storageUrl: WALLET_STORAGE_URL,
  });

  const authMiddleware = createAuthMiddleware({
    wallet,
    allowUnauthenticated: false,
    logger: console,
    logLevel: "debug",
    certificatesToRequest: {
      certifiers: [CERTIFIER_IDENTITY_KEY],
      types: {
        [CERTIFICATE_TYPE_ID]: ["cool"],
      },
    },
    onCertificatesReceived: (
      senderPublicKey: string,
      certs: VerifiableCertificate[],
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => {
      console.log("CERTS RECEIVED from", senderPublicKey, certs);
      if (!CERTIFICATES_RECEIVED[senderPublicKey]) {
        CERTIFICATES_RECEIVED[senderPublicKey] = [];
      }
      CERTIFICATES_RECEIVED[senderPublicKey].push(...certs);
      next();
    },
  });

  // TODO 3: Configure payment middleware
  // TODO 4: Define interface for payment requests

  app.get("/", (req: Request, res: Response) => {
    res.send("Hello, world!");
  });

  app.get(
    "/protected",
    authMiddleware,
    (req: AuthRequest, res: Response) => {
      if (req.auth && req.auth.identityKey !== "unknown") {
        res.send(
          `Hello, authenticated peer with public key: ${req.auth.identityKey}`,
        );
      } else {
        res.status(401).send("Unauthorized");
      }
    },
  );
  // TODO 5: Replace routes with weather route
  app.listen(port, () => {
    // TODO 6: Update server start log for weather API

    console.log(
      `authServer is running on port ${port} http://localhost:${port}`,
    );
  });
}

init().catch((err) => {
  console.error("Failed to initialize server:", err);
});
