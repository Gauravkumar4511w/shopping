# haat. — the modern bazaar

A demo shopping site built with React + Vite, with a small Node/Express API for login and signup.

## Features

- Product grid with category filters, search, sort and a saved (wishlist) view
- Bag drawer with quantities, free-shipping meter and totals in ₹
- Login and signup with real accounts:
  - passwords hashed with scrypt (never stored as plain text)
  - sessions in an `httpOnly`, `SameSite=Lax` cookie (not readable from JavaScript)
  - server-side validation, rate limiting on login/signup, JSON-only writes to block CSRF
- Checkout asks you to log in first (checkout itself is a demo, no payments)

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:8787` and the site on `http://localhost:5173`
(Vite proxies `/api` to the API). Locally, accounts are stored in `data/haat.db` (git-ignored),
so no Turso account is needed for development.

## Deploy on Vercel

Every push to `main` deploys automatically. `vercel.json` builds the Vite site into `dist/`
and sends `/api/*` to the serverless function in `api/index.js`.

Accounts need a [Turso](https://turso.tech) database, because Vercel's disk is temporary.
Add these two environment variables in Vercel (Project → Settings → Environment Variables),
or connect Turso from the Vercel **Storage** tab, then redeploy:

| Name                  | Value                                   |
| --------------------- | --------------------------------------- |
| `TURSO_DATABASE_URL`  | `libsql://<your-db>.turso.io`           |
| `TURSO_AUTH_TOKEN`    | a database token from Turso             |

Tables are created automatically on the first request. Until the variables are set, the shop
works and the login form says accounts are not switched on yet.

## Self-hosting

```bash
npm run build
npm start
```

`npm start` serves the built site and the API from one Express server on `PORT` (default 8787).
Without the Turso variables it stores accounts in `data/haat.db`. Run it behind HTTPS so the
session cookie is marked `Secure`.

## Project layout

```
api/index.js       Vercel serverless entry for the API
server/app.js      Express API (auth routes, password hashing, sessions)
server/db.js       Turso / local SQLite connection and schema
server/index.js    Local and self-hosted server
src/App.jsx        Page layout and state
src/components/    Product cards, bag drawer, login/signup modal, account menu
src/data/          Product catalogue
```
