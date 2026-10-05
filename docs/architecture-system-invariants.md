# System Architecture & Invariants — Bintang Review

## 1. System Overview & Architectural Invariants

Bintang Review is a high-performance Google Review acceleration and smart funnel platform for hospitality businesses (cafes, restaurants, retail).

### Core Technology Stack
- **Runtime Environment:** Node.js 22+ (TypeScript 5.7.3 strict mode)
- **Application Framework:** Next.js 15.2.0 (App Router, React 19.0.0)
- **Styling Architecture:** Tailwind CSS 3.4.17 with PostCSS, `clsx`, and `tailwind-merge`
- **Data Persistence:** Supabase PostgreSQL (Postgres 15+) with Row-Level Security (RLS) & triggers
- **Client State Management:** Custom reactive in-memory store with LocalStorage hydration & fallback (`src/lib/store.ts`)
- **Test Harness:** Vitest 3.0.7 / 3.2.7 in isolated Node environment with `@/*` path mapping
- **Domain SSOT:** All shared types and interfaces are strictly centralized in `src/lib/types.ts`

### Route Topology & Project Structure
- `/r/[slug]` (`src/app/r/[slug]/page.tsx`): High-speed customer redirect & review funnel (accessed via table stand NFC/QR scan).
- `/portal/[slug]` (`src/app/portal/[slug]/page.tsx`): Venue owner analytics, feedback inbox, and retainer subscription management.
- `/admin` (`src/app/admin/page.tsx`): Unified dashboard for Super Admin and Marketing Specialists.
- `/login` (`src/app/login/page.tsx`): Secure PIN-based role gateway (`super_admin`, `marketing_specialist`, `owner`).
- `/api/*`: REST endpoints handling authentication, venue management, payments, and portal verification.

---

## 2. Entity & Data Scoping Matrix

Strict boundaries separate Global Master Data from Operational Tenant Items:

| Entity Name | Storage Level | Scope Boundary | Lifecycle & Cascade Policy | Access Control (RLS / Auth) |
| :--- | :--- | :--- | :--- | :--- |
| **`venues`** | Database Table | Primary Tenant (`slug`, `id`) | Root Operational Entity. Deletion cascades to all telemetry. | Public read for funnel; PIN-protected for Owner; Super Admin / assigned Specialist full access. |
| **`sales_agents`** | Database Table | Global Master Data | Unscoped. Referenced by `venues.sales_id`. `ON DELETE SET NULL`. | Super Admin full CRUD; Specialist reads self via PIN. |
| **`scan_logs`** | Database Table | Operational Tenant Item | Scoped by `venue_id`. `ON DELETE CASCADE`. | Public insert via customer scan; Owner & Admin read-only. |
| **`feedback_messages`**| Database Table | Operational Tenant Item | Scoped by `venue_id`. `ON DELETE CASCADE`. | Public insert via 1-3 star funnel; Owner & Admin read-only. |
| **`payment_confirmations`** | Database Table | Operational Tenant Item | Scoped by `venue_id`. `ON DELETE CASCADE`. | Public/Owner insert; Super Admin verification & approval. |
| **`hpp_bearers`** | JSON Array in `venues` | Embedded Entity | Scoped to parent venue record. Lifecycle bound to `venues`. | Managed via Admin Venue Modal & Settlement API. |

---

## 3. Persistence Architecture & State Invariants

### 1. Hybrid Reactive Store & Offline Resilience (`src/lib/store.ts`)
- **Immediate Optimistic Updates:** UI state updates synchronously in local memory to ensure sub-100ms response times.
- **LocalStorage Fallback:** When running without active Supabase credentials (or in automated test environments), state transparently hydrates from and persists to `localStorage`.
- **Database Synchronization:** When connected, mutations trigger asynchronous calls to Supabase REST APIs with fallback error boundaries.

### 2. Multi-Bearer HPP & Settlement Engine (`src/lib/profitSharing.ts`)
- **Zero Rounding Drift Invariant:** The sum of all allocated shares, developer fees, transport fees, and reimbursements MUST strictly equal `deal_amount`.
- **Reciprocal Developer Fee:**
  - Deal closed by Vicky &rarr; 100% Developer Fee to Natan.
  - Deal closed by Natan &rarr; 100% Developer Fee to Vicky.
  - Deal closed by external specialist &rarr; Split 50:50.
- **Remittance Flow (Field Model):** Client pays Marketing Specialist directly &rarr; Specialist retains earned share + modal &rarr; Specialist remits platform dues (`deal_amount - marketing_retained`) to company bank account.

---

## 4. God Files Watchlist & Strangler Pattern Targets

The following modules exceed the 300-line threshold and are designated for incremental extraction:

1. **`src/components/AdminVenueModal.tsx` (~1199 lines):**
   - *Risk:* Combines form state, billing rules, multi-bearer dynamic rows, and complex validation.
   - *Extraction Target:* Split into `VenueGeneralFormSection`, `VenueHppBearerSection`, and `useVenueFormState`.
2. **`src/app/admin/page.tsx` (~941 lines):**
   - *Risk:* Manages tabs, role verification, 5 modals, financial metrics calculation, and venue tables.
   - *Extraction Target:* Extract executive financial cards, payment verification table, and specialist cards into standalone modules.
3. **`src/lib/store.ts` (~846 lines):**
   - *Risk:* Combines Supabase queries, local mock defaults, and mutation handlers.
   - *Extraction Target:* Separate into `supabaseClient.ts`, `mockStore.ts`, and slice-specific data hooks.
4. **`src/lib/profitSharing.ts` (~589 lines):**
   - *Risk:* Large math engine with legacy fallbacks.
   - *Status:* Covered by comprehensive unit tests (`tests/profitSharing.test.ts`, `tests/settlement.test.ts`).
