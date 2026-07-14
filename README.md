Where can we generate a BSV Key:
https://guarda.com/app

To make sure the app runs:
nvm install 20
nvm use 20

#vscode extensions
Improve and Enhance our code and make it attractive by adding Colorful Comments we use:
Colorful comments

How to run Lab 14:

### Prerequisites

- Node 20 (`nvm install 20 && nvm use 20`).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running** (LARS uses it to spin up MongoDB, MySQL, Adminer and the overlay backend itself).
- A BSV wallet app running locally (e.g. MetaNet Desktop), listening on `http://localhost:3301`. `WalletClient` connects to it automatically — you don't configure the port yourself.
- If you have a MongoDB server already running locally (e.g. via Homebrew) on port `27017`, **stop it** before starting LARS. LARS provisions its own MongoDB container bound to the same port, and the two will conflict:
  ```
  brew services stop mongodb-community@6.0
  ```

### 1. Install dependencies

In this exact order:

```bash
npm install                 # root
cd backend && npm install   # backend
cd ../frontend && npm install # frontend
```

### 2. MongoDB — nothing to set up manually

You do **not** need to install MongoDB, or create any database/collection by hand. As long as Docker Desktop is running, `npm start` (see below) makes LARS generate its own `docker-compose.yml` (in the gitignored `local-data/` folder) with a `mongo:6.0` container, and wires our `ls_uhrp` lookup service to it automatically — because `deployment-info.json` already has `"backend"` in its `run` list and `lookupServices.ls_uhrp.hydrateWith: "mongo"`. The `uhrp` collection is created lazily by MongoDB itself the first time a commitment is stored.

You can optionally create a root `.env` with:
```
DB_CONNECTION=mongodb://localhost:27017
PORT=8080
NODE_ENV=development
```
but be aware this is **not actually read** by the backend in this LARS-managed setup — the Mongo connection LARS uses is generated internally (its own `MONGO_URL`, wired straight into the Docker container), independent of this file. It's only kept here for parity with the generic lab instructions. (The file is already in `.gitignore` regardless.)

### 3. Start everything

From the project root:

```bash
npm start
```

This runs `lars start`, which:
- On the very first run, may ask you to set up a server private key (choose **generate new key**) and, if your balance is low, asks about funding — choose **"🚀 Continue without funding"** for local testing (this project doesn't need a funded server wallet).
- Builds and starts Docker containers for MongoDB, MySQL, Adminer, mongo-express and the overlay backend (`tm_uhrp` / `ls_uhrp`), listening on `http://localhost:8080`.
- Starts the Vite frontend dev server on `http://localhost:5173`.

Wait until you see `🎧 LARS is ready and listening on local port 8080` in the terminal before testing.

### 4. Test the flow

1. Open `http://localhost:5173`.
2. Click the `+` button to open "Create File Storage Commitment".
3. Either upload a small file, or click **"Switch to URL Input"** and paste a real `http(s)://` URL.
4. Set **Hosting Time (minutes) to 15 or more** — nanostore's real minimum; anything less is rejected by the server.
5. Click **Submit**, and wait — the app has to (a) upload the file, (b) wait for nanostore's advertisement to propagate on the public network (can take up to ~50 seconds), and (c) broadcast a token to the local `tm_uhrp` topic. Watch the browser console for progress logs.
6. On success, the UHRP URL is displayed and logged to the console.

### 5. Verify the commitment was stored

The overlay backend stores admitted commitments in MongoDB, in a database called `LARS_lookup_services` (not `overlay-db`, despite what `MONGO_URL` suggests — `@bsv/overlay-express` uses its own fixed database name).

```bash
docker exec lars_bsv-mongo-1 mongosh --quiet LARS_lookup_services --eval "db.uhrp.find().pretty()"
```

Or open **mongo-express** at `http://localhost:8082` (login `admin` / `pass`) and browse to `LARS_lookup_services` → `uhrp`.

You can also query the lookup service directly:
```bash
curl "http://localhost:8080/lookup?service=ls_uhrp" -H "Content-Type: application/json" -d '{"query":{"uhrpUrl":"<uhrp url from the UI>"}}'
```

### Troubleshooting

- **A request to `http://localhost:3301/verifySignature` stays "pending" forever in the Network tab, and the browser slows down/freezes**: this is your local wallet app failing to respond to a signature-verification request during payment authentication. Restart the wallet app and try again.
- **`Upload info request failed` / `Resiliency threshold... HTTP 400`**: almost always means the hosting time is below nanostore's 15-minute minimum.
- **Port `27017` already in use / MongoDB container won't start**: you likely have a local MongoDB service running — stop it (see Prerequisites).
- **`Could not resolve a public HTTP URL for the uploaded file yet`**: nanostore hasn't finished propagating its advertisement to the public SHIP network yet. This is retried automatically for about a minute; if it still fails, just try submitting again.
