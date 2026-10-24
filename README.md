# QuickPick Counter — Production Self-Service Kiosk & Counter System

QuickPick Counter is a full-stack, enterprise-grade automated snack ordering kiosk and smart locker retrieval management application. It features customer ordering with 120-second stock holds, atomic concurrency controls, HMAC-SHA256 verified payment webhooks, automated stock-reversion cron jobs, and a comprehensive real-time administrative telemetry dashboard.

---

## 1. Architecture & Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Approved Theme: `#636B2F`, `#BAC095`, `#D4DE95`, `#3D4127`).
- **Backend:** Node.js, Express.js (ES modules), TypeScript.
- **Database:** PostgreSQL with Prisma ORM.
- **Security & Integrity:**
  - HMAC-SHA256 signature verification with raw body capture and `crypto.timingSafeEqual`.
  - Atomic conditional updates (`where: { physicalStock: { gte: quantity } }`) to prevent overselling.
  - Idempotent payment webhook event logging (`WebhookEvent` table).
  - Single-claim concurrency protection on smart lockers with HTTP 409 Conflict handling.
  - Monetary values stored strictly as integer **paise**.

---

## 2. Directory Structure

```
QuickPick-Counter/
├── backend/
│   ├── prisma/             # PostgreSQL schema and database seed script
│   ├── src/
│   │   ├── config/         # Prisma client configuration
│   │   ├── controllers/    # Express controllers (products, orders, webhooks, admin)
│   │   ├── middlewares/    # Authentication and role guards
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Stock reversion cron, deletion validation, notifications
│   │   └── server.ts       # Express app setup and middleware configuration
│   └── tests/              # Automated integration and unit test suite (Vitest + Supertest)
│       ├── integration/    # Concurrency, webhook, and stock revert tests
│       └── unit/           # Security and HMAC verification tests
├── documents/
│   ├── CODE_AUDIT_REPORT.md    # Full-stack code quality and architectural audit
│   ├── PERFORMANCE_REPORT.md # Before/after benchmark and latency measurements
│   └── TECHNICAL_DEBT.md     # Architectural debt ledger
├── frontend/
│   ├── src/
│   │   ├── components/     # Customer kiosk & Admin portal components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Customer and Admin API clients
│   │   └── App.tsx         # Root application router and layout manager
│   └── public/             # Static snack imagery and assets
└── scripts/
    └── test-webhook.mjs    # Executable HMAC-SHA256 signed webhook test script
```

---

## 3. Environment Variables

Create `.env` in the root and `backend/` directories (see `.env.example`):

```ini
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:root@localhost:5432/quickpick?schema=public"
JWT_SECRET="quickpick-super-secret-jwt-key-2026"
WEBHOOK_SECRET="quickpick_shared_webhook_secret_2026"
```

Frontend `.env` (`frontend/.env`):

```ini
VITE_API_URL="http://localhost:3000/api"
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js v18+ or v20+
- PostgreSQL database instance running on `localhost:5432`

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run db:seed    # Seeds catalog, categories, smart lockers, and admin user
npm run dev        # Starts backend on http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

---

## 5. Verification & Testing

### Run Automated Integration & Unit Tests
```bash
cd backend
npm test
```
*Expected output: 14 passing tests covering 10-customer concurrency, webhook HMAC verification, idempotency replay, and pickup claim conflict handling.*

### Dispatch Signed Payment Webhook
```bash
# Simulates a payment.captured webhook event signed with HMAC-SHA256:
node scripts/test-webhook.mjs ORD1234 captured

# Simulates payment failure:
node scripts/test-webhook.mjs ORD1234 failed
```

### Production Build
```bash
# Verify TypeScript and bundle optimization
cd backend && npm run build
cd ../frontend && npm run build
```
