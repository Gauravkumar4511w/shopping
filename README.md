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

Needs Node 22.13 or newer (uses the built-in `node:sqlite`).

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:8787` and the site on `http://localhost:5173`
(Vite proxies `/api` to the API). User accounts are stored in `data/haat.db`, which is git-ignored.

## Production

```bash
npm run build
npm start
```

`npm start` serves the built site and the API from one Express server on `PORT` (default 8787).
Set `NODE_ENV=production` behind HTTPS so the session cookie is marked `Secure`.

## Project layout

```
server/            Express API (auth routes, SQLite, password hashing)
src/App.jsx        Page layout and state
src/components/    Product cards, bag drawer, login/signup modal, account menu
src/data/          Product catalogue
```
