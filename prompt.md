# QuickPick Counter — Phase 1: Planning & Technical Design

Act as a senior software architect and backend engineer with extensive experience in Node.js, Express.js, TypeScript, PostgreSQL, transaction processing, payment webhooks, and concurrent systems.

Your task is to analyze the assignment requirements and create a complete, professional planning document set for **QuickPick Counter**, a self-service snack ordering and locker pickup application.

## 1. Project Requirements

### Mandatory technology stack
- Backend: Node.js + Express.js + TypeScript.
- Database: PostgreSQL.
- ORM: Prisma with support for explicit transactions and PostgreSQL row-level locking where required.
- Frontend: React + Vite + TypeScript.
- Automated testing: Vitest and Supertest, with integration tests against a real PostgreSQL database.
- Runtime: Docker Compose.
- Package manager: npm.

Use TypeScript throughout the application. Store monetary values as integer paise, never floating-point rupees.

### Required features

**Product catalog and stock**
- Seed approximately five snack products.
- Each product has an ID, name, price in paise, and physical stock quantity.
- `GET /products` returns available units after subtracting units held by unpaid, unexpired orders.

**Order creation and stock holds**
- `POST /orders` accepts a list of product IDs and quantities.
- Calculate the total using trusted database prices.
- Hold stock for 120 seconds.
- Prevent concurrent orders from reserving more units than are available.
- If any requested item is unavailable, reject the entire order without holding partial stock.
- Return `expiresInSeconds`, calculated on the server when preparing the response.
- Expired unpaid orders must transition to `expired` and release their stock.

**Payment webhook**
- Endpoint: `POST /payments/webhook`.
- Validate the `X-Signature` header using HMAC-SHA256 over the exact raw request body and a shared secret stored in an environment variable.
- Process each `eventId` idempotently.
- If the captured payment amount does not match the order total, mark the order `needs_review` and do not mark it paid.
- Document a clear policy for valid payments received after the stock hold expires.
- Provide an npm script to send a correctly signed test webhook.

**Pickup**
- Endpoint: `POST /orders/:id/pickup-claim`.
- Only paid orders can be claimed.
- Exactly one of two concurrent claims for the same order may succeed.
- Losing requests must receive HTTP 409 Conflict.
- Unpaid, expired, or already-claimed orders must not be claimed.
- Permanently deduct stock exactly once on successful pickup.

**Customer frontend**
- Display products and available quantities.
- Allow customers to build a cart and submit an order.
- Show a payment screen with a countdown.
- Poll order status until it is `paid`, `expired`, or `needs_review`.
- Make countdown calculations independent of the customer's potentially inaccurate clock.
- Keep the UI simple and usable.

**Automated integration tests**
Use a real PostgreSQL database, not mocked repositories, for critical concurrency tests:
1. Ten simultaneous customers attempt to order the final two units. Exactly two units may be held, and unsuccessful orders must fail cleanly.
2. Replaying the same payment webhook event must not process it twice.
3. Two simultaneous pickup claims must result in exactly one success.

**Documentation**
- `README.md`: setup, run commands, tests, decisions, assumptions, limitations, and future improvements.
- `AI_NOTES.md`: AI tools used, one effective prompt, and at least one specific AI mistake discovered and corrected. Keep this honest and concise.

## 2. Planning Rules

- Do not implement application code in this phase.
- Inspect the existing workspace before deciding whether to create or reuse files.
- Do not overwrite existing work without examining it.
- Treat the assignment requirements as the source of truth.
- Separate mandatory requirements from optional improvements.
- Identify ambiguous requirements and record explicit decisions.
- Prioritize correctness, concurrency safety, idempotency, and real database tests over visual polish.
- Do not claim a design is concurrency-safe without explaining the database mechanism.
- Prefer a simple architecture over unnecessary enterprise abstractions.
- Do not introduce Redis, message brokers, microservices, or additional infrastructure unless a documented requirement justifies them.

## 3. Create These Planning Documents

Create a `documents/planning/` directory containing the following Markdown files.

### A. `PROJECT_OVERVIEW.md`
Include:
- Project purpose and scope.
- Problem statement.
- Target user and system actors.
- Functional requirements.
- Non-functional requirements.
- Mandatory deliverables.
- Success criteria.
- Explicit out-of-scope items.

### B. `TECHNICAL_ARCHITECTURE.md`
Define:
- Overall architecture and request flow.
- Express application structure.
- Controller, service, repository/data-access, validation, and middleware responsibilities.
- Frontend/backend communication.
- PostgreSQL access through Prisma.
- Where raw SQL may be needed for row-level locking.
- Error handling and logging strategy.
- Docker Compose services and startup dependencies.
- How environment configuration is managed.

Keep the architecture appropriately simple for a technical assessment.

### C. `DATABASE_DESIGN.md`
Define the proposed PostgreSQL schema, relationships, constraints, indexes, and data types.

Evaluate entities such as:
- `Product`
- `Order`
- `OrderItem`
- `PaymentEvent` or webhook event records
- Pickup claim state, using an order field or separate record only if justified.

Document:
- Integer paise representation.
- Physical stock versus held stock.
- Order and payment status enums.
- Order expiration timestamps.
- Unique event IDs for idempotency.
- Constraints that prevent invalid quantities and negative stock.
- Relevant indexes for availability, expiration, order lookup, and event processing.

Do not store a separately mutable available-stock count unless the design explains how it stays consistent. Prefer deriving availability from physical stock minus valid outstanding holds, or present a justified alternative that supports atomic reservation.

### D. `ORDER_AND_STOCK_CONCURRENCY.md`
Explain the intended transaction flow for order creation.

Cover:
- How concurrent requests reserve the same stock safely.
- PostgreSQL row-level locks or conditional atomic updates.
- Consistent locking order when multiple products are involved.
- Transaction rollback when any item is unavailable.
- The exact definition of a valid stock hold.
- How expiration is enforced even if no background worker is running.
- How expired orders are transitioned and made available again.
- How duplicate product IDs in one request are normalized.
- How the implementation prevents overselling.

Compare alternatives briefly and choose one approach. Explain why it is correct.

### E. `PAYMENT_WEBHOOK_DESIGN.md`
Specify:
- Exact raw-body HMAC-SHA256 verification.
- Signature comparison using a timing-safe method.
- Secret management and failure behavior.
- Payment event idempotency and unique database constraints.
- Atomic processing of an event and order state transition.
- Handling malformed events, unknown orders, duplicate events, invalid signatures, and amount mismatches.
- Whether non-captured statuses are ignored, recorded, or handled separately.
- The chosen late-payment policy and rationale.
- How payment events are audited without exposing secrets.
- The signed webhook test script requirements.

For late payments, choose and document a consistent policy. A valid capture arriving after expiration must never silently oversell stock. A defensible policy is to move the order to `needs_review`, retain an audit record, and flag the payment for refund or manual resolution rather than reclaiming stock that may have been sold elsewhere. Explain the assumptions and edge cases.

### F. `PICKUP_CONCURRENCY_DESIGN.md`
Specify:
- Preconditions for claiming an order.
- Atomic state transition from paid and unclaimed to claimed.
- How a transaction or conditional update ensures only one locker wins.
- Why simultaneous claims cannot both succeed.
- When physical stock is deducted permanently.
- How retries and already-claimed orders are handled.
- The HTTP response and conflict semantics.

Resolve the stock-accounting lifecycle carefully: holding stock must not deduct it twice. Clearly distinguish reserving stock, payment capture, successful pickup, and physical inventory reduction. Choose a single consistent inventory model and document it.

### G. `API_CONTRACT.md`
Document each endpoint with:
- HTTP method and path.
- Request headers.
- Request and response JSON examples.
- Success and error status codes.
- Input validation rules.
- Relevant order state transitions.

Include:
- `GET /products`
- `POST /orders`
- A documented order status endpoint for frontend polling.
- `POST /payments/webhook`
- `POST /orders/:id/pickup-claim`
- A health endpoint for local orchestration.

The status endpoint must not expose payment secrets or unnecessary internal data.

### H. `TEST_STRATEGY.md`
Define:
- Unit tests versus integration tests.
- Real PostgreSQL test setup.
- Database isolation and cleanup strategy.
- Concurrency test methodology using genuinely concurrent requests.
- Ten-customers/two-units test.
- Duplicate-webhook replay test.
- Simultaneous-pickup test.
- Hold-expiration and late-payment tests.
- Signature validation and amount mismatch tests.
- Test commands and expected invariants.
- How to avoid false-positive concurrency tests caused by sequential execution or mocks.

### I. `IMPLEMENTATION_PLAN.md`
Create an ordered implementation plan:
1. Project initialization and Docker Compose.
2. PostgreSQL and Prisma schema.
3. Product seeding and catalog API.
4. Atomic order creation and stock holds.
5. Expiration handling and order status polling.
6. Payment webhook security and idempotency.
7. Pickup claim concurrency.
8. Real PostgreSQL integration tests.
9. React customer screen and server-time countdown.
10. README, AI_NOTES, regression testing, and final review.

For each phase include:
- Deliverables.
- Dependencies.
- Acceptance criteria.
- Tests that must pass before proceeding.

Prioritize backend parts 2–4 and their tests if time is limited.

### J. `ASSUMPTIONS_AND_DECISIONS.md`
Record:
- Explicit assumptions.
- Decisions made where the assignment permits alternatives.
- Late-payment policy.
- Inventory accounting model.
- Hold-expiration semantics.
- How server time is communicated to the frontend.
- Treatment of unknown or duplicate webhook events.
- Unfinished or deferred work.
- Future improvements if more time were available.

Do not silently invent requirements.

## 4. Required Final Review

After creating the documents:
- Check for contradictions between the schema, transaction design, payment flow, pickup flow, and API contract.
- Verify that stock is never held twice, oversold, or deducted twice.
- Verify that webhook retries cannot produce duplicate state changes.
- Verify that a late payment cannot consume stock already sold to another order.
- Verify that two pickup claims cannot both succeed.
- Verify that the proposed countdown does not depend on the customer's wall clock.
- Verify that the critical integration tests use real PostgreSQL.
- List unresolved questions or risks rather than pretending they are solved.

Create a short `documents/planning/PLANNING_REVIEW.md` containing the consistency review and any remaining risks.

## 5. Final Response

When finished, report:
- The documents created.
- The most important architecture and concurrency decisions.
- Any unresolved assumptions.
- The recommended first implementation phase.

Do not begin coding until the planning documents have been reviewed and approved.