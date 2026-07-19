# BookHub Backend

Node.js + Express API — Google OAuth session verification.

---

## Deploy to Render (recommended)

### 1. Push to GitHub
Make sure your repo is on GitHub (see `github/README.md`).

### 2. Create a new Web Service on Render
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set these settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### 3. Add environment variables
In the Render dashboard → your service → **Environment**, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `WEB_ORIGIN` | `https://BookHub1.github.io` (your GitHub Pages URL) |
| `GOOGLE_CLIENT_ID` | `239301146552-t0si8iftqsr3hohpf402i6n3unlitab1.apps.googleusercontent.com` |

### 4. Deploy
Click **Deploy**. Render will install dependencies and start the server.
Your backend URL will be something like: `https://bookhub-backend.onrender.com`

### 5. Wire the frontend
In `auth.js` at the root of the project, set:
```js
const BACKEND_BASE = "https://bookhub-backend.onrender.com";
```
Then sync that file to `github/auth.js` and push.

---

## Local development

```bash
cd backend
cp .env.example .env
# edit .env with your values
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/healthz` | Health check — returns `{ ok: true }` |
| `POST` | `/api/auth/google` | Verify Google ID token → set `bh_session` cookie |
| `POST` | `/api/auth/logout` | Clear `bh_session` cookie |
| `GET`  | `/api/me` | Return current session user |

### POST /api/auth/google
**Body:** `{ "idToken": "<Google ID token from One Tap>" }`
**Response:** `{ ok: true, user: { id, name, email, picture } }`

### POST /api/auth/logout
**Response:** `{ ok: true }`

### GET /api/me
**Response (logged in):** `{ loggedIn: true, user: { id, name, email, picture } }`
**Response (not logged in):** `{ loggedIn: false }`

---

## Stack
- **Express 4** — HTTP framework
- **Helmet** — security headers
- **CORS** — locked to `WEB_ORIGIN`
- **cookie-parser** — session cookie reading
- **node-fetch + jwk-to-pem + jsonwebtoken** — Google JWKS token verification
- **express-rate-limit** — 200 req / 15 min

---

## Google OAuth setup (required for real login)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Edit OAuth client `239301146552-t0si8iftqsr3hohpf402i6n3unlitab1`
3. **Authorised JavaScript origins** — add all of:
   - `https://BookHub1.github.io`
   - `https://bookhub-backend.onrender.com`
   - `http://localhost`
4. Save and wait ~5 minutes to propagate
