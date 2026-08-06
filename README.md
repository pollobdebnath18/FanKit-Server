<div align="center">

# 🏏 FanKit Server

**REST API for the FanKit sports-merchandise e-commerce platform.**

Powered by Express 5, MongoDB, Stripe, and Firebase Admin.

**Live API:** [https://fankit-server.onrender.com](https://fankit-server.onrender.com)

</div>

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Auth & Authorization](#auth--authorization)
- [Payments](#payments)
- [Deployment](#deployment)
- [Related Repositories](#related-repositories)

---

## 🧰 Tech Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Runtime     | Node.js                                        |
| Framework   | [Express 5](https://expressjs.com)             |
| Database    | MongoDB (official `mongodb` driver, no ODM)    |
| Payments    | [Stripe](https://stripe.com)                    |
| Auth        | Firebase Admin SDK                              |
| Environment | `dotenv`                                        |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- A MongoDB database
- Firebase project with a service account

### Install & run

```bash
npm install
npm run dev
```

Server runs on `http://localhost:8000` by default (override with `PORT`).
The root route `GET /` returns a health message.

> Optionally seed the database with demo data:
> ```bash
> npm run seed
> ```

---

## 🔐 Environment Variables

Copy your environment into `.env` (see `.env.example`):

```env
# --- Core ---
MONGODB_URI=mongodb+srv://...
DB_NAME=FanKitDB
PORT=8000
NODE_ENV=development

# --- URLs / CORS ---
BASE_URL=http://localhost:8000
RENDER_EXTERNAL_URL=
VERCEL_URL=
VERCEL=
CLIENT_URL=http://localhost:5173

# --- Firebase Admin (verify auth, custom data) ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_WEB_API_KEY=

# --- Google OAuth (optional) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- SMTP (optional email) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
PAYMENT_CURRENCY=bdt
```

---

## 📜 Scripts

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `npm run dev`  | Start dev server with hot reload (`tsx watch src/server.ts`) |
| `npm run seed` | Populate MongoDB with demo data    |
| `npm run build`| Compile TypeScript → `dist/`       |
| `npm start`    | Run the compiled server (`node dist/server.js`) |

---

## 📁 Project Structure

```
src/
├── server.ts               # Express app, CORS, route mounting, error handler
├── seed.ts                 # Database seed script
├── lib/
│   ├── mongodb.ts          # Mongo client connection
│   ├── db.ts               # Typed collection access
│   ├── env.ts              # Environment helper
│   ├── middleware.ts       # requireAuth / requireAdmin guards
│   ├── validation.ts       # Request validation helpers
│   ├── stripe.ts           # Stripe SDK setup
│   ├── order.service.ts    # Order snapshot / totals logic + ApiError
│   └── firebase-admin.ts   # Firebase Admin SDK initialization
└── routes/                 # Express routers (one per resource)
```

---

## 🔗 API Reference

All endpoints are mounted under `/api`. Replace `:id`/`:slug` with a real
value. Authenticated endpoints require a valid Firebase `idToken` in the
`Authorization` header.

### Products — `/api/products`
| Method   | Path       | Description                  | Auth  |
| -------- | ---------- | ---------------------------- | ----- |
| GET      | `/`        | List products                | Admin |
| GET      | `/:slug`   | Get product (slug or id)     | —     |
| POST     | `/`        | Create product               | Admin |
| PATCH    | `/:id`     | Update product               | Admin |
| DELETE   | `/:id`     | Delete product               | Admin |

### Collections — `/api/collections`
| Method | Path | Description | Auth |
| ------ | ---- | ----------- | ---- |
| GET    | `/`  | Filtered list (`search`, `category`, `subcategory`, `type`, `team`, `sort`, `minPrice`/`maxPrice`, `page`, `limit`, `featured`, `onSale`) | — |

### Cart — `/api/cart` *(auth)*
| Method | Path          | Description               |
| ------ | ------------- | ------------------------- |
| GET    | `/`           | Get current user's cart   |
| POST   | `/items`      | Add item `{productId, size?, quantity}` |
| PATCH  | `/items/:id`  | Update item quantity      |
| DELETE | `/items/:id`  | Remove item               |
| DELETE | `/`           | Clear cart                |

### Wishlist — `/api/wishlist` *(auth)*
| Method | Path                    | Description       |
| ------ | ----------------------- | ----------------- |
| GET    | `/`                     | List wishlist     |
| POST   | `/items`                | Add item `{productId}` |
| DELETE | `/items/:productId`     | Remove item       |

### Orders — `/api/orders`
| Method | Path                 | Description                     | Auth  |
| ------ | -------------------- | ------------------------------- | ----- |
| GET    | `/`                  | Current user's orders           | User  |
| GET    | `/admin`             | All orders                      | Admin |
| GET    | `/payments/:paymentIntentId` | Resolve order by payment intent | — |
| GET    | `/:id`               | Order detail (owner/admin)      | User  |
| POST   | `/`                  | Place an order (checkout)       | User  |
| PATCH  | `/:id/status`        | Update order status             | Admin |
| PATCH  | `/:id/tracking`      | Set tracking number             | Admin |

### Reviews — `/api`
| Method | Path                              | Description        | Auth  |
| ------ | --------------------------------- | ------------------ | ----- |
| GET    | `/products/:productId/reviews`    | Public reviews     | —     |
| POST   | `/products/:productId/reviews`    | Add review (1–5)   | User  |
| PATCH  | `/reviews/:id`                    | Update own review  | Owner |
| DELETE | `/reviews/:id`                    | Delete own review  | Owner |

### Users — `/api/users`
| Method | Path           | Description                          | Auth  |
| ------ | -------------- | ------------------------------------ | ----- |
| GET    | `/`            | List users                           | Admin |
| GET    | `/me`          | Current user                         | User  |
| PATCH  | `/me`          | Update profile                       | User  |
| PATCH  | `/me/password` | Change password                      | User  |
| GET    | `/auth-status` | Auth state check                     | —     |
| PATCH  | `/:id/role`    | Set a user's role                    | Admin |
| DELETE | `/:id`         | Delete a user                        | Admin |
| POST   | `/set-role`    | Assign default role after sign-up    | —     |

### Addresses — `/api/addresses` *(auth)*
| Method | Path      | Description       |
| ------ | --------- | ----------------- |
| GET    | `/`       | List addresses    |
| POST   | `/`       | Create address    |
| PATCH  | `/:id`    | Update address    |
| DELETE | `/:id`    | Delete address    |

### Blog — `/api/blog`
| Method | Path     | Description           |
| ------ | -------- | --------------------- |
| GET    | `/`      | List published posts   |
| GET    | `/:slug` | Get a post            |

### Misc — `/api`
| Method | Path             | Description                     |
| ------ | ---------------- | ------------------------------- |
| POST   | `/contact`       | Submit a contact form           |
| POST   | `/newsletter`    | Subscribe to the newsletter     |

### Messages — `/api`
| Method | Path       | Description         |
| ------ | ---------- | ------------------- |
| POST   | `/messages`| Send a message      |

### Payments — `/api/payments`
| Method | Path                | Description                                 |
| ------ | ------------------- | ------------------------------------------- |
| POST   | `/stripe/intent`    | Create a Stripe PaymentIntent (auth)         |
| POST   | `/stripe/webhook`   | Stripe webhook (raw body + signature check)  |
| POST   | `/stripe/confirm`   | Confirm / finalize a PaymentIntent (auth)    |

### Health
| Method | Path | Description       |
| ------ | ---- | ----------------- |
| GET    | `/`  | Server health     |

---

## 🔒 Auth & Authorization

- **Verification:** every `requireAuth` route validates the Firebase `idToken`
  in the `Authorization` header using the Firebase Admin SDK, then attaches
  `req.user`.
- **Roles:** `user` | `admin`.
- **`requireAdmin`** adds a role check (admin only) on top of auth.
- **`ApiError`** is used across routes and handled centrally
  (`server.ts` error middleware) to return consistent `{ success, message }`
  responses.

---

## 💳 Payments

- **Stripe intents:** `POST /api/payments/stripe/intent` verifies stock, snapshots
  the order, and returns a `clientSecret`. The Stripe **webhook** path mounts
  before `express.json()` so it receives the raw body for signature
  verification. The server finalizes the order as paid once the payment
  succeeds.
- **bKash:** demo-only at checkout (no merchant keys) — handled client-side.
  No bKash order endpoint exists on the server yet.

---

## 🚢 Deployment

Build and run on **Render** (or any Node host):

```bash
npm run build
npm start
```

`vercel.json` ships the compiled `dist/server.js` as a serverless function for
hosting on Vercel if preferred.

---

## 🔗 Related Repositories

- **Frontend Client:** [FanKit Client](https://fankit-two.vercel.app) — see the
  client README.
- **Project docs:** `summary.txt` and `FLOW.txt` at the repository root detail
  the architecture and end-to-end flows.