# haat. — the modern bazaar

A demo shopping site built with React + Vite, with a small Node/Express API for accounts, orders,
the newsletter and the contact form.

## Pages

| Path      | What it is                                                                        |
| --------- | --------------------------------------------------------------------------------- |
| `/`       | Landing page: hero, categories, best sellers, festive deals, how it works, latest reviews, club signup, FAQ, contact form |
| `/shop`   | Full catalogue. Filters live in the URL: `?c=Mobiles&q=iphone&brand=Apple&price=30000-59999&sort=newest` |
| `/product/:id` | Product page: photo gallery, price, specs, ratings and reviews, similar products |
| `/credits` | Credits for every freely licensed product photo |
| `/orders` | The logged-in shopper's orders, with cancel                                        |

## Features

- 116 products in 14 categories: the latest phones, laptops, tablets, audio, watches, consoles and cameras
  (2021–2025 launches) plus fashion, footwear, bags, accessories, home, beauty and sports
- Marketplace-style pricing: MRP, selling price and % off, free delivery above ₹499 (₹40 below)
- Header search with product suggestions; shop filters for category, brand, price band and sort (newest, price, rating, discount)
- Fully responsive from 320px phones to wide desktops, with a slide-in menu on phones and tablets
- Product gallery: tap thumbnails or arrows, swipe on phones, hover to zoom, tap for full screen
- Product grid with category filters, search (name, brand, tags), sort by price, rating or discount, and a saved (wishlist) view
- Real ratings and reviews: signed-in shoppers rate and review products (one review each, editable);
  shoppers who ordered the product get a "Verified buyer" badge
- Bag and saved list kept in the browser, so they survive a reload
- Checkout with a delivery address, cash on delivery and the `HAAT200` club code (₹200 off a first order);
  prices and totals are always worked out on the server
- Newsletter signup and contact form saved to the database
- Bag drawer with quantities, free-shipping meter and totals in ₹
- Login and signup with real accounts:
  - passwords hashed with scrypt (never stored as plain text)
  - sessions in an `httpOnly`, `SameSite=Lax` cookie (not readable from JavaScript)
  - server-side validation, rate limiting on login/signup, JSON-only writes to block CSRF
- Checkout asks you to log in first (no online payments: every order is cash on delivery)

## API

| Method | Path                      | Notes                                         |
| ------ | ------------------------- | --------------------------------------------- |
| POST   | `/api/auth/signup`        | `{ name, email, password }`                   |
| POST   | `/api/auth/login`         | `{ email, password }`                         |
| POST   | `/api/auth/logout`        |                                               |
| GET    | `/api/auth/me`            | `{ user }` or `{ user: null }`                |
| POST   | `/api/newsletter`         | `{ email }`, returns the club code            |
| POST   | `/api/contact`            | `{ name, email, topic, message }`             |
| POST   | `/api/orders`             | logged in; `{ items: [{ id, qty }], name, phone, address, city, pincode, coupon? }` |
| GET    | `/api/orders`             | logged in; your orders, newest first          |
| POST   | `/api/orders/:id/cancel`  | logged in; only while the order is `placed`   |
| GET    | `/api/reviews/summary`    | average rating and count for every product    |
| GET    | `/api/reviews/latest`     | newest 4★ and 5★ reviews, for the landing page |
| GET    | `/api/products/:id/reviews` | reviews, rating histogram and your own review |
| POST   | `/api/products/:id/reviews` | logged in; `{ rating, title?, body }`, posting again updates it |
| POST   | `/api/products/:id/reviews/delete` | logged in; deletes your review      |

## Product photos and prices

`src/data/products.js` is generated. Tech photos come from [Wikimedia Commons](https://commons.wikimedia.org)
under free licences (CC0, CC BY, CC BY-SA); each photo's author and licence are stored in `credits`, shown
under the product gallery and listed on `/credits`. Other photos come from [DummyJSON](https://dummyjson.com),
a free catalogue made for demo shops. No photos are copied from Flipkart or Amazon.

Prices are approximate Indian marketplace prices from late 2026; check them before selling. The products
are real branded items, so replace them with your own stock and photos before selling for real.

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
server/app.js      Express API (auth, orders, newsletter, contact)
server/db.js       Turso / local SQLite connection and schema
server/index.js    Local and self-hosted server
src/App.jsx        Header, footer, bag, login and page switching
src/pages/         Landing, Shop, Product and Orders pages
src/components/    Product cards, gallery, reviews, bag drawer + checkout, login/signup modal, forms
src/data/          Product catalogue
```
