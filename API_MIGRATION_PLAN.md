# Plan: Move ThreadCart behind a dedicated API layer

## Context

ThreadCart currently calls Supabase directly from the React app — **48 call sites** across components, hooks, contexts, and 11 thin service files. The frontend imports the Supabase client, reads/writes tables directly, owns checkout orchestration (Razorpay flow → order creation → invoice PDF generation → email), and relies on RLS as the primary authorization mechanism.

**Goals driving this work (all four selected):**
1. **Security** — hide DB schema, enforce auth/business rules server-side, stop relying on RLS as the only line of defense.
2. **Portability** — clean HTTP seam so Supabase (or any single provider) can be swapped without rewriting the React app.
3. **Business logic** — atomic checkout, server-verified Razorpay payments, server-side PDF + email, rate limiting, fraud checks — things RLS cannot do well.
4. **Architecture** — one clear data boundary; this repo becomes a pure frontend.

**Target architecture:** **Two repositories.**
- `ThreadCart` (this repo) — React frontend, no Supabase client, no DB knowledge. Only talks HTTP/JSON to the API.
- `ThreadCart-API` (new repo, stack TBD) — owns the database, auth, payments, files, email. Pure backend service.

**Effort estimate (revised after the choices below): ~5-7 weeks of focused work.** Auth-wrapping alone is ~1 week because OAuth callback, email confirmation, and session refresh all need to be reimplemented behind your own endpoints. Full-scope migration with separate Node server and wrapped auth is the most expensive path on every axis — but it's also the cleanest end state and the right call if you want true portability.

**Decisions made in planning conversation:**
- API runtime: **Separate Node/Express (or equivalent) server** in its own repo
- Migration scope: **Full** — every call site goes through the API
- Auth: **Fully wrapped** — frontend never talks to Supabase Auth directly
- Motivations: all four (security, portability, business logic, architecture)
- Stack/language: **deferred** — see recommendation below

---

## Recommended backend stack (flagged — to be confirmed)

Stack will be decided later. Here's a sensible default with reasoning, so the plan has something concrete to land on. **None of these are locked in.**

| Decision | Recommendation | Why |
|---|---|---|
| Language | **TypeScript** | Share types/validators with frontend, same hire pool, no context-switch cost. |
| Framework | **Fastify** (or NestJS if team prefers structure) | Fastify is fast, TS-native, simple. NestJS if you want DI/modules out of the box. |
| API style | **REST + Zod schemas as source of truth** | Most stack-portable (you could rewrite backend in Go/Python later without touching frontend). Zod schemas live in a `shared/` package; frontend gets generated TS types. Avoids tRPC's bidirectional TS lock-in while keeping type safety. |
| DB access | **Supabase Postgres via `service_role` key + `postgres.js` or Prisma** | Backend has full DB access; RLS becomes a defense-in-depth fallback. |
| Auth | **Keep Supabase Auth as the identity provider, but proxy through API** | API owns `/auth/login`, `/auth/signup`, `/auth/oauth/google`, `/auth/refresh`. Backend calls Supabase Auth admin SDK internally. Frontend never sees Supabase. Issues your own session cookies or returns Supabase JWTs through your API. |
| Hosting | **Dockerized; pick Render/Fly/Railway at deploy time** | Don't paint into a corner. Keep the app 12-factor (env-driven, stateless) and deploy target is interchangeable. |

Flag any of these to revisit before kickoff.

---

## High-level migration phases

**Phase 0 — Backend repo skeleton (1-2 days)**
New repo, TS + Fastify + Zod + Supabase service-role client. Dockerfile. CI for tests. Shared `schemas/` directory. CORS configured for frontend dev origin.

**Phase 1 — Auth wrapping (4-5 days)** — biggest single block
- `POST /auth/signup` (email/password) → Supabase Auth admin API → returns session
- `POST /auth/login` → Supabase Auth → returns session
- `GET /auth/oauth/google` + callback → handle code exchange server-side
- `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`
- `POST /auth/confirm-email` (replaces direct Supabase flow)
- Middleware: JWT verification on protected routes, admin role check
- Frontend: build `apiClient` that holds session, replace `supabase.auth.*` everywhere

**Phase 2 — Read endpoints (3-4 days)**
Wrap the public-read tables behind GET endpoints:
- `GET /categories`, `GET /categories/:id/subcategories`, `GET /subcategories/:id/products`
- `GET /products/:id`, `GET /products/:id/cad-files`
- `GET /gallery`, `GET /pincodes/:pincode/check`
RLS stays for defense-in-depth but is no longer the primary authz.

**Phase 3 — Cart + order endpoints (3-4 days)**
- `POST /cart`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `GET /cart`
- `POST /cart/merge` (atomic — replaces the loop in `CartContext`)
- `POST /orders` (server-side validates cart, creates order + line items in a transaction)
- `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`

**Phase 4 — Checkout / payment / invoice (5-7 days)** — most complex
- `POST /checkout/initiate` → returns Razorpay order_id (server creates Razorpay order with secret key — currently client-side, a security improvement)
- `POST /checkout/verify` → server verifies Razorpay signature, creates DB order in a transaction, clears cart, generates invoice PDF, emails admin
- Move jsPDF invoice generation server-side (use `pdfkit` or `puppeteer`)
- Move EmailJS calls behind `POST /notifications/order` (or use server-side email like Resend/SES — EmailJS is a frontend service and shouldn't live behind an API)

**Phase 5 — Admin + file uploads (3-4 days)**
- `POST /admin/categories`, `PATCH /admin/products/:id`, etc. — all writes for admin UI
- `POST /admin/cad-files/upload-url` (replaces the existing `cad-file-url` Edge Function logic, now in the new API)
- `POST /admin/images/upload-url` (replaces `upload-image` Edge Function)
- `GET /admin/orders`, `PATCH /admin/orders/:id/status`, `DELETE /admin/orders/:id`
- `GET /admin/subscribers`, `POST /admin/pincodes`
- Admin role enforced at middleware, not by email-string-match

**Phase 6 — Frontend refactor (parallelizable with Phases 2-5)**
- Add `src/lib/apiClient.ts` — fetch wrapper with session handling, error normalization
- Refactor each `src/services/*.service.ts` to call `apiClient` instead of `supabase`
- Delete `src/utils/supabase.tsx` once nothing imports it
- Update `CartContext`, `Navbar`, `AuthModal`, `ConfirmEmail`, `useLeadCaptureTrigger`, `CadFileDownloads` — these import Supabase directly today
- Delete `src/utils/adminCheck.ts` (admin check is now a server response, not a client email match)

**Phase 7 — Cutover + RLS lockdown (2-3 days)**
- Tighten RLS to deny-all for anon role on tables the API now owns (backend uses service role and bypasses RLS).
- Remove `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from frontend env; replace with `VITE_API_URL`.
- E2E smoke test all flows in staging.
- Decommission the 3 existing Edge Functions (`cad-file-url`, `upload-image`, `delete-image`) — logic moves to new API.

---

## Frontend inventory — what gets touched in this repo

These are the files in `ThreadCart` that import or call Supabase directly today. Each gets refactored to use `apiClient` instead. The 11 service files are the primary seam — refactoring them first means most components don't need to change.

**Services (refactor first — replaces internals, keeps public signatures):**
- `src/services/cart.service.ts`
- `src/services/order.service.ts`
- `src/services/checkout.service.ts`
- `src/services/address.service.ts`
- `src/services/admin-order.service.ts`
- `src/services/cad-files.service.ts`
- `src/services/gallery.service.ts`
- `src/services/contact.service.ts`
- `src/services/leadCapture.service.ts`
- `src/services/quote-request.service.ts`
- `src/services/order-notification.service.ts`
- `src/services/invoice-email.service.ts`
- `src/services/imagekit.service.ts`
- `src/services/storage/storage.service.ts` (R2 broker — keep abstraction, swap provider)

**Direct Supabase imports outside services (refactor to use services or apiClient):**
- `src/utils/supabase.tsx` → delete
- `src/utils/adminCheck.ts` → delete (admin status comes from `/auth/me`)
- `src/context/CartContext.tsx` → replace `onAuthStateChange` with API session listener
- `src/components/Navbar.tsx` → same
- `src/components/auth/AuthModal.tsx` → call `/auth/login`, `/auth/signup`, `/auth/oauth/google`
- `src/pages/ConfirmEmail.tsx` → call `/auth/confirm-email`
- `src/hooks/useLeadCaptureTrigger.ts` → use API session
- `src/components/product/CadFileDownloads.tsx` → call `/cad-files/:id/download-url`
- `src/components/AddItems/UpdatePrices.tsx`, `ManageProducts.tsx`, `ManageCategories.tsx`, `AddSubCategoryForm.tsx`, `CatalogSortOrder.tsx`, `AddPincodeForm.tsx`, `CartSummary.tsx`, `CheckoutPage.tsx`, `OrderHistoryPage.tsx`, `OrderDetailsPage.tsx` → all currently call Supabase directly; should route through services that now hit the API

**New frontend code:**
- `src/lib/apiClient.ts` — fetch wrapper (base URL, auth header, error normalization, retry)
- `src/lib/session.ts` — session storage + refresh logic
- `src/context/AuthContext.tsx` — new, centralizes what `Navbar` + `CartContext` + others duplicate today

---

## Reuse opportunities

- **`src/services/storage/storage.service.ts`** already abstracts file storage — the abstraction stays, the provider implementation moves server-side (frontend asks API for presigned URL, uploads directly to R2 in browser).
- **Existing Edge Functions** (`cad-file-url`, `upload-image`, `delete-image`) are working examples of the auth-check + presigned-URL pattern — port the logic, don't rewrite from scratch.
- **Existing service files' public signatures** can stay the same — only internals change. This means most components don't need to touch.
- **Razorpay client SDK** stays in the frontend (it has to — the checkout modal is client-side). Only the order-creation and signature-verification calls move server-side.
- **`generate_order_number` RPC** stays as a Postgres function — the API calls it instead of the client.

---

## Risks / things to think about

1. **EmailJS is frontend-only.** It can't be called from a Node backend. You'll need to switch to a server-side email service (Resend, SES, Postmark) when invoices move server-side. Plan a separate migration sub-task for this.
2. **Razorpay key on the client today.** Moving order creation server-side means the secret key moves to the backend — small but real security improvement. Frontend keeps only the publishable key.
3. **Session storage.** Decide cookies vs Authorization header before Phase 1. Cookies (HttpOnly, Secure, SameSite=Lax) are safer; header-based is simpler for SPAs. Pick one and stick with it.
4. **OAuth callback URL changes.** Google OAuth currently points at Supabase's callback. After Phase 1, it points at `https://api.threadcart.com/auth/oauth/google/callback`. Update Google console + Supabase Auth settings.
5. **CORS.** Backend must allow the frontend origin. Configure early or you'll waste hours debugging blocked requests.
6. **Local dev story.** Two repos = two dev servers + a shared `.env`. Document the bring-up flow in both READMEs.
7. **Don't migrate everything before testing anything.** Get auth + one read endpoint + one write endpoint flowing end-to-end in staging before grinding through the rest. The first vertical slice will surface 80% of the gotchas.

---

## Verification (when implementation eventually starts)

Each phase ends with:
- All affected endpoints have integration tests against a test database
- One golden-path frontend smoke test per flow (signup → add to cart → checkout → see order)
- Staging deploy + manual click-through before merging to main
- Old Supabase imports verified gone via `grep -r "from.*supabase" src/`

---

## Open questions to resolve before kickoff

1. Final backend language + framework (TS+Fastify recommended).
2. Final API style (REST+Zod recommended).
3. Hosting target (defer until stack is picked).
4. Session mechanism: HttpOnly cookies vs Authorization header.
5. Server-side email provider to replace EmailJS (Resend / SES / Postmark).
6. Is the new backend repo named `ThreadCart-API`, or something else?
