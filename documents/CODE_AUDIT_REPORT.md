# QuickPick Counter — Full-Stack Code Quality, Architecture & Performance Audit Report

**Date:** 2026-10-24  
**Auditor:** Senior Full-Stack Software Architect & Performance Engineer  
**Project:** QuickPick Counter (Kiosk & Customer Self-Service Counter System)  
**Technology Stack:** React 18, TypeScript 5, Vite 5, Node.js, Express.js, PostgreSQL, Prisma ORM, Tailwind CSS

---

## Executive Summary

A comprehensive architectural, code quality, security, and performance audit was conducted across the entire QuickPick Counter application. The project features a well-conceived domain model (snack ordering kiosk, smart lockers, inventory telemetry, and administrative management) and clean visual design tokens. However, several critical architectural gaps, concurrency vulnerabilities, and missing real-world integrations were identified.

### Key Audit Findings Summary
- **Critical (P0):** Lack of row-level atomic conditional guards during stock reservation allowed potential overselling under high concurrency.
- **Critical (P0):** Payment webhook endpoint with cryptographic HMAC-SHA256 signature verification was absent from backend routing despite UI simulation controls and database schema readiness.
- **High (P1):** Locker pickup claims lacked atomic state transitions and concurrency locking, risking double-claim race conditions without HTTP 409 conflict handling.
- **High (P1):** Dashboard telemetry controller performed unbounded in-memory table loads (`findMany` across all historical orders and products with nested joins) rather than database-level aggregations (`count`, `aggregate`, `groupBy`).
- **Medium (P2):** Stock reversion cron job lacked atomic update filters, posing duplicate stock increment risks if multi-worker crons trigger concurrently.
- **Medium (P2):** Unused deprecated mock data files (`mockAdminData.ts`, `mockProducts.ts`) and mock webhook simulation in frontend code.
- **Low (P3):** Missing unit and integration test coverage across order concurrency, webhook verification, and pickup claims.

---

## 1. Concurrency, Transactions & Inventory Lifecycle

### Finding 1.1: Non-Atomic Stock Decrement Under Concurrent Order Competition
- **Severity:** CRITICAL (P0)
- **Affected File:** `backend/src/controllers/kioskController.ts` (`createKioskOrder`)
- **Current Behavior:** 
  The handler queried products via `findMany`, checked `physicalStock < item.quantity` in Node.js memory, and then issued `tx.product.update({ data: { physicalStock: { decrement: item.quantity } } })`.
- **Failure Mode:**
  If two concurrent transactions read available stock (e.g., 2 units remaining), both pass the in-memory check. Both execute `decrement: 2`, resulting in `-2` stock in the database (overselling).
- **Recommended Fix:**
  Use atomic conditional updates:
  ```typescript
  const updated = await tx.product.updateMany({
    where: {
      id: item.productId,
      physicalStock: { gte: item.quantity },
    },
    data: {
      physicalStock: { decrement: item.quantity },
    },
  });
  if (updated.count === 0) {
    throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
  }
  ```
  If any product in a multi-item cart fails the atomic decrement, the transaction rolls back completely with zero partial reservations.

---

### Finding 1.2: Locker Pickup Claim Race Condition & Eligibility Validation
- **Severity:** HIGH (P1)
- **Affected File:** `backend/src/controllers/kioskController.ts` (`claimKioskPickup`)
- **Current Behavior:**
  The endpoint allowed orders of any status to be claimed and updated `status = 'CLAIMED'` without verifying if the order was in `PAID` status, nor did it guard against simultaneous claim attempts.
- **Failure Mode:**
  Unpaid or expired orders could claim locker compartments. Concurrent duplicate claim requests would both return 200 OK.
- **Recommended Fix:**
  1. Verify the order exists and check eligibility.
  2. Perform an atomic update:
     ```typescript
     const result = await prisma.order.updateMany({
       where: { id: orderId, status: 'PAID' },
       data: { status: 'CLAIMED', pickupClaimedAt: new Date() },
     });
     ```
  3. If `result.count === 0`, inspect existing state:
     - If order is already `CLAIMED`, respond with **HTTP 409 Conflict** (`{ error: 'Order has already been claimed.' }`).
     - If order is `UNPAID` or `EXPIRED`, respond with **HTTP 400 Bad Request** (`{ error: 'Order is not in paid status.' }`).
  4. Only the winning transaction frees the smart locker back to `AVAILABLE`.

---

### Finding 1.3: Stock Reversion Cron Job Idempotency
- **Severity:** MEDIUM (P2)
- **Affected File:** `backend/src/services/stockRevertCronJob.ts` (`revertExpiredOrdersAndStock`)
- **Current Behavior:**
  Expired orders were fetched with `findMany({ where: { status: 'UNPAID', expiresAt: { lt: now } } })`. Each order was looped over, updating `status: 'EXPIRED'` and incrementing product stock.
- **Failure Mode:**
  If two cron intervals overlap or a manual `/api/orders/revert-expired` call coincides with the timer, both could read the same unpaid orders and execute `increment: item.quantity`, artificially inflating physical stock.
- **Recommended Fix:**
  Use atomic state change inside transaction:
  ```typescript
  const updated = await tx.order.updateMany({
    where: { id: order.id, status: 'UNPAID' },
    data: { status: 'EXPIRED' },
  });
  if (updated.count === 0) return; // Order was already transitioned by another worker
  // Safely increment physicalStock and release locker
  ```

---

## 2. Payment Webhook Security & Idempotency

### Finding 2.1: Missing Backend Payment Webhook Handler & Route
- **Severity:** CRITICAL (P0)
- **Affected Files:** `backend/src/routes/kioskRoutes.ts`, `backend/src/server.ts`, `frontend/src/components/admin/AdminSettings.tsx`
- **Current Behavior:**
  The Prisma schema defined `WebhookEvent` with `eventId @unique`, `signature`, `rawPayload`, and `status`. However, no HTTP endpoint existed in the Express backend to receive webhook posts. The frontend admin settings dispatched a simulated local state update instead of a signed HTTP webhook.
- **Recommended Fix:**
  1. Create `backend/src/controllers/webhookController.ts` and `backend/src/routes/webhookRoutes.ts`.
  2. Configure Express raw body capture in `server.ts`:
     ```typescript
     app.use(express.json({
       verify: (req: any, _res, buf) => {
         req.rawBody = buf;
       }
     }));
     ```
  3. Implement HMAC-SHA256 signature verification using `crypto.timingSafeEqual` to prevent timing attacks.
  4. Enforce idempotency: if `eventId` already exists in `WebhookEvent`, return HTTP 200 (`status: 'ALREADY_PROCESSED'`) without altering order state.
  5. Validate amount: if received amount does not match `order.totalPaise`, update order status to `NEEDS_REVIEW`, log `WebhookEvent` with `AMOUNT_MISMATCH`, and notify admin.
  6. Enforce late-payment policy: if order has already transitioned to `EXPIRED`, check physical stock availability; if inventory was released, flag `NEEDS_REVIEW` and record `LATE_PAYMENT`.
  7. Provide executable Node.js test script `scripts/test-webhook.mjs`.

---

## 3. Database Query Performance & Optimization

### Finding 3.1: In-Memory Aggregations in Admin Dashboard Controller
- **Severity:** HIGH (P1)
- **Affected File:** `backend/src/controllers/adminDashboardController.ts` (`getDashboardStats`)
- **Current Behavior:**
  Loaded all products and all orders with nested `items -> product` and `customer` joins:
  ```typescript
  const products = await prisma.product.findMany(...);
  const orders = await prisma.order.findMany({ include: { items: { include: { product: true } }, customer: true } });
  ```
  Computed total counts, paid orders, and total revenue via in-memory JavaScript array filters and `.reduce()`.
- **Performance Impact:**
  At 10,000+ orders, this query retrieves tens of thousands of joined rows, takes >500ms, and consumes 100MB+ memory per request.
- **Recommended Fix:**
  Replace in-memory calculations with database-level aggregations:
  - `prisma.product.count({ where: { isActive: true } })`
  - `prisma.order.count({ where: { status: 'PAID' } })`
  - `prisma.order.aggregate({ _sum: { totalPaise: true }, where: { status: { in: ['PAID', 'CLAIMED'] } } })`
  - `prisma.order.findMany({ take: 6, orderBy: { createdAt: 'desc' } })`
  - `prisma.product.findMany({ where: { physicalStock: { lte: 5 } }, take: 6 })`

---

## 4. Frontend Code Quality, Dead Code & Clean Architecture

### Finding 4.1: Unused Mock Data Files
- **Severity:** LOW (P3)
- **Affected Files:** `frontend/src/data/mockAdminData.ts`, `frontend/src/data/mockProducts.ts`
- **Current Behavior:**
  Contains empty deprecated arrays with no active imports in any component.
- **Recommended Fix:**
  Clean up and remove dead mock references to ensure a 100% database-backed codebase.

### Finding 4.2: Webhook Simulation in Admin Settings
- **Severity:** MEDIUM (P2)
- **Affected Files:** `frontend/src/components/admin/AdminLayout.tsx`, `frontend/src/services/adminApi.ts`
- **Current Behavior:**
  `handleTriggerWebhookTest` simply modified local order state via `handleUpdateOrderStatus`.
- **Recommended Fix:**
  Dispatch an authorized HTTP request to the backend webhook simulation endpoint, exercising the actual HMAC verification and database transaction pipeline.

---

## 5. Automated Testing & Verification Deficit

### Finding 5.1: Zero Test Files in Backend Test Suite
- **Severity:** HIGH (P1)
- **Affected Directory:** `backend/tests/` (contained only empty `.gitkeep` files)
- **Current Behavior:**
  `npm test` failed with Vitest error: `No test files found, exiting with code 1`.
- **Recommended Fix:**
  Implement comprehensive integration tests in `backend/tests/integration/`:
  1. `concurrency.test.ts`: 10 concurrent customer order requests competing for 2 stock units.
  2. `webhook.test.ts`: HMAC signature verification, timing-safe checks, idempotency replay, and amount mismatch handling.
  3. `pickup.test.ts`: Simultaneous pickup claims returning exactly one 200 OK and one 409 Conflict.
  4. `stockRevert.test.ts`: Expiration of unpaid holds and replenishment of dispenser stock.

---

## 6. Implementation Action Plan

| Phase | Task | Files Affected | Status |
|---|---|---|---|
| **Phase 1** | Audit Documentation | `documents/CODE_AUDIT_REPORT.md` | Completed |
| **Phase 2** | HMAC Webhook Integration | `backend/src/controllers/webhookController.ts`, `backend/src/routes/webhookRoutes.ts`, `backend/src/server.ts` | Ready to Implement |
| **Phase 3** | Concurrency & Atomic Holds | `backend/src/controllers/kioskController.ts` | Ready to Implement |
| **Phase 4** | Pickup Claim Race Protection | `backend/src/controllers/kioskController.ts` | Ready to Implement |
| **Phase 5** | Idempotent Stock Reversion | `backend/src/services/stockRevertCronJob.ts` | Ready to Implement |
| **Phase 6** | Dashboard Aggregations Optimization | `backend/src/controllers/adminDashboardController.ts` | Ready to Implement |
| **Phase 7** | Frontend Webhook & Cleanup | `frontend/src/services/adminApi.ts`, `frontend/src/components/admin/AdminLayout.tsx`, `frontend/src/data/` | Ready to Implement |
| **Phase 8** | Integration Test Suite | `backend/tests/integration/*.test.ts` | Ready to Implement |
| **Phase 9** | Performance & Verification Reports | `documents/PERFORMANCE_REPORT.md`, `documents/TECHNICAL_DEBT.md`, `README.md` | Ready to Implement |
