# QuickPick Counter — Technical Debt & Architectural Ledger

**Last Updated:** 2026-10-24  
**Author:** Senior Full-Stack Software Architect

---

## 1. Resolved Technical Debt

| Item | Category | Resolution Summary |
|---|---|---|
| **Inventory Overselling Under Concurrency** | Data Integrity | Replaced unsafe in-memory checks with atomic `updateMany({ where: { physicalStock: { gte: qty } } })` inside a rollback-capable transaction. |
| **Missing Payment Webhook Route & HMAC** | Security / Integration | Created `webhookController.ts` and `webhookRoutes.ts` with raw body capture, timing-safe comparison, idempotency tracking via `WebhookEvent`, and late-payment fallback. |
| **Locker Double-Claim Vulnerability** | Concurrency | Enforced atomic `status: 'PAID'` condition on claim transition; conflicts return HTTP 409 and reject duplicate locker releases. |
| **In-Memory Dashboard Full Table Scans** | Performance | Refactored `getDashboardStats` to use parallel database-level `count()`, `aggregate()`, and bounded `take: 6` selections. |
| **Idempotent Stock Reversion Cron** | Reliability | Modified `revertExpiredOrdersAndStock` to check `where: { status: 'UNPAID' }` during transition to prevent double stock replenishment on concurrent executions. |
| **Dead Mock Data Files** | Code Cleanliness | Completely removed `frontend/src/data/mockAdminData.ts` and `frontend/src/data/mockProducts.ts`. |
| **Frontend Webhook Simulation Disconnect** | Functional Integrity | Replaced client-side state manipulation with real signed API calls to `/api/admin/orders/simulate-webhook`. |
| **Missing Automated Test Suite** | Testing | Implemented 14 Vitest & Supertest integration/unit tests validating concurrency, webhooks, idempotency, and security. |

---

## 2. Monitored Items & Recommended Future Enhancements

### 2.1. Code Splitting on Frontend Bundle
- **Observation:** `dist/assets/index-30pSJeI5.js` is ~519 kB uncompressed (129 kB gzipped).
- **Recommendation:** Utilize dynamic `import()` for Admin Portal sub-tabs (`AdminLockers`, `AdminSettings`, `AdminCustomers`) in `App.tsx` so customer kiosk users only download kiosk-specific bundles.

### 2.2. Hardware MQTT Integration Bridge
- **Observation:** Locker door solenoid commands currently persist door states (`unlocked`, `locked`, `open`) in PostgreSQL.
- **Recommendation:** Implement an MQTT or WebSocket adapter to bridge database events to physical microcontroller hardware (e.g. ESP32 relay modules) for production station deployments.

### 2.3. Redis Caching for Read-Heavy Catalog (Optional at Scale)
- **Observation:** Product catalog queries respond in sub-10ms via PostgreSQL indexes.
- **Recommendation:** Only introduce Redis if traffic exceeds 10,000 concurrent kiosk terminals. Current PostgreSQL connection pooling and indexing is optimal and adds zero unnecessary infrastructure complexity.
