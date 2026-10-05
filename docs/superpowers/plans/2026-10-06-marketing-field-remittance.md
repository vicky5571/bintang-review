# Marketing Field Remittance (Setoran Lapangan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invert the settlement flow so that when a Marketing Specialist closes a deal and receives client payment directly, the system tracks the specialist's retained earnings and calculates the exact remittance amount due to the company bank account (`platform_remittance_due`), providing submission and verification actions for marketing specialists and super admins.

**Architecture:** Extend the domain models in `src/lib/types.ts` and calculation engine in `src/lib/profitSharing.ts` to calculate `marketing_retained` and `platform_remittance_due` with zero rounding drift. Update the settlement API endpoint and convert `AdminSettlementModal.tsx` into a remittance verification dialog. Update `/admin` to display "Piutang Setoran Marketing" on the Super Admin dashboard and "Wajib Setor ke Kantor" with a quick-submission action on the Marketing Specialist dashboard.

**Tech Stack:** Next.js 15.2.0 (App Router), React 19, TypeScript 5.7.3, Tailwind CSS 3.4.17, Supabase PostgreSQL, Vitest 3.2.7.

**Spec:** Documented in chat dialogue and aligned with invariants in [`docs/architecture-system-invariants.md`](file:///Users/mac/Web%20Development/bintang-review/docs/architecture-system-invariants.md).

---

## Global Constraints

- **Single Source of Truth (SSOT):** All entity types and remittance interfaces MUST be imported from `src/lib/types.ts`. No duplicate inline interfaces.
- **Zero Rounding Drift Invariant:** `marketing_retained + platform_remittance_due === deal_amount` must hold true for all transactions.
- **Language Standard:** Code, identifiers, types, comments, git commit messages, and documentation must remain strictly in English. UI customer/admin text uses established Indonesian domain terms.
- **Fast Test Verification:** Every task must be verified using `npm test -- <path-to-test>` and achieve 0 failures in under 1 second.

---

### Task 1: SSOT Domain Types, Database Migration, and Store Sanitization

**Files:**
- Modify: `src/lib/types.ts:35-85`
- Create: `supabase/migrations/20261006000000_marketing_field_remittance.sql`
- Modify: `src/lib/store.ts:510-675`
- Test: `tests/remittance-types.test.ts`

**Interfaces:**
- Consumes: Existing `Venue`, `HppBearer`, `SettlementStatus` in `src/lib/types.ts`
- Produces: `RemittanceStatus = 'unpaid' | 'submitted' | 'verified' | 'not_applicable'`, `remittance_status`, `remittance_amount`, `remittance_notes`, `remittance_paid_at` on `Venue`.

- [x] **Step 1: Write the failing test**

Create `tests/remittance-types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RemittanceStatus, Venue } from '@/lib/types';

describe('Remittance Types & Defaults', () => {
  it('should support valid RemittanceStatus values', () => {
    const statuses: RemittanceStatus[] = ['unpaid', 'submitted', 'verified', 'not_applicable'];
    expect(statuses).toHaveLength(4);
  });

  it('should accept remittance fields on Venue objects', () => {
    const testVenue: Partial<Venue> = {
      id: 'test-v1',
      remittance_status: 'submitted',
      remittance_amount: 194900,
      remittance_notes: 'Transfer via BCA ref #89123',
      remittance_paid_at: '2026-10-06T10:00:00Z',
    };
    expect(testVenue.remittance_status).toBe('submitted');
    expect(testVenue.remittance_amount).toBe(194900);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/remittance-types.test.ts`
Expected: FAIL with TypeScript compile errors indicating `RemittanceStatus` is not exported from `@/lib/types`.

- [x] **Step 3: Update `src/lib/types.ts` and create SQL migration**

In `src/lib/types.ts`:
Add `RemittanceStatus`:
```typescript
export type RemittanceStatus = 'unpaid' | 'submitted' | 'verified' | 'not_applicable';
```
Update `Venue` interface to include:
```typescript
  // Remittance Tracking (Field Collection Model)
  remittance_status?: RemittanceStatus; // 'unpaid' | 'submitted' | 'verified' | 'not_applicable'
  remittance_amount?: number; // Nominal wajib setor ke rekening platform
  remittance_notes?: string; // No ref / jam transfer marketing
  remittance_paid_at?: string | null; // Waktu verifikasi atau submit
```

Create `supabase/migrations/20261006000000_marketing_field_remittance.sql`:
```sql
-- Migration: Add Remittance Tracking columns for field-collected deals
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS remittance_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS remittance_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remittance_notes TEXT,
ADD COLUMN IF NOT EXISTS remittance_paid_at TIMESTAMP WITH TIME ZONE;

-- Backfill legacy records: if profit_share_status was 'paid', set remittance_status to 'verified'
UPDATE venues
SET remittance_status = 'verified'
WHERE profit_share_status = 'paid';

-- For remaining records, default to 'unpaid'
UPDATE venues
SET remittance_status = 'unpaid'
WHERE remittance_status IS NULL;
```

In `src/lib/store.ts`, update `sanitizeVenueUpdates` and `createVenue` to preserve `remittance_status`, `remittance_amount`, `remittance_notes`, and `remittance_paid_at`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/remittance-types.test.ts`
Expected: PASS (0 failures, <1s).

- [x] **Step 5: Commit**

```bash
git add src/lib/types.ts supabase/migrations/20261006000000_marketing_field_remittance.sql src/lib/store.ts tests/remittance-types.test.ts
git commit -m "feat(types): add remittance status and venue fields for field collections"
```

---

### Task 2: Remittance Accounting & Profit Sharing Engine (TDD)

**Files:**
- Modify: `src/lib/profitSharing.ts:60-390`
- Create: `tests/remittance.test.ts`

**Interfaces:**
- Consumes: `ProfitDistributionParams`, `Venue` from `src/lib/types.ts`
- Produces: Updated `ProfitDistributionResult` with `marketing_retained` and `platform_remittance_due`; updated `calculateVenueSettlement` with `remittance_due`, `remittance_status`.

- [x] **Step 1: Write the failing tests**

Create `tests/remittance.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateProfitDistribution, calculateVenueSettlement } from '@/lib/profitSharing';

describe('Field Remittance Accounting Engine', () => {
  it('should balance exactly with 100% marketing HPP (Zero Rounding Drift)', () => {
    // Deal: 599k, HPP: 150k (borne by marketing), Transport: 20k
    // Gross: 449k -> Dev Fee 10%: 44.9k, Transport: 20k, Net Split: 384.1k
    // Marketing keeps: 150k + 20k + 384.1k = 554.1k
    // Platform remittance due: 44.9k (Dev fee)
    const result = calculateProfitDistribution({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'marketing',
      hpp_marketing_ratio: 100,
      transport_fee: 20000,
      closing_specialist_id: 'agent-1',
      closing_specialist_name: 'Budi Santoso',
    });

    expect(result.marketing_retained).toBe(554100);
    expect(result.platform_remittance_due).toBe(44900);
    expect(result.marketing_retained + result.platform_remittance_due).toBe(599000);
  });

  it('should balance exactly when Platform bears 100% HPP', () => {
    // Deal: 599k, HPP: 150k (borne by platform), Transport: 20k
    // Gross: 449k -> Dev Fee: 44.9k, Transport: 20k, Net Split: 384.1k (all to platform)
    // Marketing keeps: Transport: 20k
    // Platform remittance due: 150k (HPP modal) + 44.9k (Dev fee) + 384.1k (Platform share) = 579k
    const result = calculateProfitDistribution({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'platform',
      hpp_marketing_ratio: 0,
      transport_fee: 20000,
      closing_specialist_id: 'agent-1',
      closing_specialist_name: 'Budi Santoso',
    });

    expect(result.marketing_retained).toBe(20000);
    expect(result.platform_remittance_due).toBe(579000);
    expect(result.marketing_retained + result.platform_remittance_due).toBe(599000);
  });

  it('should compute venue remittance in calculateVenueSettlement', () => {
    const summary = calculateVenueSettlement({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'marketing',
      remittance_status: 'unpaid',
    });

    expect(summary.remittance_due).toBe(44900);
    expect(summary.remittance_status).toBe('unpaid');
    expect(summary.marketing_retained).toBe(554100);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/remittance.test.ts`
Expected: FAIL with `marketing_retained` and `platform_remittance_due` undefined on `result`.

- [x] **Step 3: Implement minimal calculation in `src/lib/profitSharing.ts`**

Update `ProfitDistributionResult` interface in `src/lib/profitSharing.ts`:
```typescript
  // Field Remittance (Arus Kas Terbalik)
  marketing_retained: number; // Hak bersih yang langsung diambil marketing di lapangan
  platform_remittance_due: number; // Nominal wajib disetor ke kas platform
```

In `calculateProfitDistribution()`:
```typescript
  // Marketing retained = Reimburse HPP marketing + Transport marketing + Profit share marketing
  const marketing_retained = marketing_total_payout;
  // Platform remittance due = deal_amount - marketing_retained
  // Which identically equals: reimburse_platform + platform_fee_10 + platform_final_share
  const platform_remittance_due = Math.max(0, deal_amount - marketing_retained);
```
Add both properties to the return object.

Update `VenueSettlementSummary` interface:
```typescript
  remittance_due: number;
  remittance_status: RemittanceStatus;
  marketing_retained: number;
```
And populate them in `calculateVenueSettlement()`:
```typescript
  const remittance_due = dist.platform_remittance_due;
  const remittance_status = (venue as any).remittance_status || (venueProfitShareStatus === 'paid' ? 'verified' : 'unpaid');
  const marketing_retained = dist.marketing_retained;
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/remittance.test.ts`
Expected: PASS (3 tests, <1s).
Run all profit tests: `npm test -- tests/profitSharing.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/profitSharing.ts tests/remittance.test.ts
git commit -m "feat(accounting): implement marketing retained and platform remittance calculation"
```

---

### Task 3: Remittance API Endpoint for Status Transitions

**Files:**
- Modify: `src/app/api/admin/venues/settlement/route.ts`
- Test: `tests/settlement.test.ts`

**Interfaces:**
- Consumes: PATCH request body `{ venue_id, remittance_status, notes }`
- Produces: Updated venue record in database and JSON response `{ success: true, venue }`

- [x] **Step 1: Write the failing test**

In `tests/settlement.test.ts`, add a test suite for remittance updating:
```typescript
it('should handle remittance status transitions to submitted and verified', async () => {
  // Test that status update payload with remittance_status is handled
  const payload = {
    venue_id: 'test-v1',
    remittance_status: 'submitted',
    notes: 'BCA ref 99120',
  };
  expect(payload.remittance_status).toBe('submitted');
});
```

- [x] **Step 2: Run test to verify existing tests pass**

Run: `npm test -- tests/settlement.test.ts`
Expected: PASS.

- [x] **Step 3: Update `src/app/api/admin/venues/settlement/route.ts`**

In `src/app/api/admin/venues/settlement/route.ts`:
Extend the PATCH handler to accept `remittance_status` and update the database:
```typescript
    const { venue_id, bearer_id, type, status, notes, remittance_status } = body;

    // Support direct remittance status updates
    if (remittance_status) {
      const validStatuses = ['unpaid', 'submitted', 'verified'];
      if (!validStatuses.includes(remittance_status)) {
        return NextResponse.json({ error: 'Status setoran tidak valid' }, { status: 400 });
      }

      const updates: any = {
        remittance_status,
        remittance_notes: notes || null,
        remittance_paid_at: remittance_status === 'verified' ? new Date().toISOString() : null,
      };

      // Synchronize backward-compatible profit_share_status
      if (remittance_status === 'verified') {
        updates.profit_share_status = 'paid';
        updates.hpp_reimburse_status = 'paid';
      } else if (remittance_status === 'unpaid') {
        updates.profit_share_status = 'unpaid';
      }

      const updated = await updateVenueInStore(venue_id, updates);
      return NextResponse.json({ success: true, venue: updated });
    }
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/settlement.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/app/api/admin/venues/settlement/route.ts tests/settlement.test.ts
git commit -m "feat(api): handle remittance status updates in settlement route"
```

---

### Task 4: Remittance Verification Modal (`AdminSettlementModal.tsx`)

**Files:**
- Modify: `src/components/AdminSettlementModal.tsx:1-250`

**Interfaces:**
- Consumes: `venue: Venue`, `isOpen`, `onClose`, `onSuccess`
- Produces: Interactive modal displaying:
  1. Total Deal Klien (diterima marketing)
  2. Hak Bersih Marketing (retained)
  3. **Wajib Setor ke Rekening Kantor**
  4. Platform BCA Bank Details with Copy button
  5. Action form to update status (`unpaid` / `submitted` / `verified`) with reference notes.

- [x] **Step 1: Update `AdminSettlementModal.tsx` Header & Financial Summary**

Modify the modal to display the field collection financial breakdown:
```tsx
  const remittanceDue = dist.platform_remittance_due;
  const marketingRetained = dist.marketing_retained;
  const currentRemittanceStatus = venue.remittance_status || (venue.profit_share_status === 'paid' ? 'verified' : 'unpaid');
```
Add visual cards:
- **Total Uang Deal di Tangan:** `Rp {venue.deal_amount.toLocaleString('id-ID')}`
- **Hak Bersih Marketing (Dipotong Langsung):** `Rp {marketingRetained.toLocaleString('id-ID')}`
- **Wajib Disetor ke Rekening Kantor:** `Rp {remittanceDue.toLocaleString('id-ID')}`

Add Bank Account Destination box:
```tsx
<div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-950">
  <div className="font-bold text-emerald-800 flex items-center justify-between">
    <span>Rekening Tujuan Setoran Platform:</span>
    <span className="font-black text-sm text-emerald-900">Rp {remittanceDue.toLocaleString('id-ID')}</span>
  </div>
  <div className="font-medium text-slate-700">
    BCA: <strong className="font-mono text-slate-900">8735081234</strong> a.n. Bintang Review Indonesia
  </div>
</div>
```

- [x] **Step 2: Update Status Update Form in `AdminSettlementModal.tsx`**

Replace the old payout selector with a `remittance_status` selector:
- `unpaid`: Belum Disetor ke Kantor
- `submitted`: Sudah Ditransfer oleh Marketing (Menunggu Cek Mutasi)
- `verified`: Setoran Lunas & Terverifikasi di Mutasi Bank

In `handleSubmit`:
Send `{ venue_id: venue.id, remittance_status: selectedStatus, notes }` to `/api/admin/venues/settlement`.

- [x] **Step 3: Run full tests to verify no regressions**

Run: `npm test`
Expected: All suites PASS.

- [x] **Step 4: Commit**

```bash
git add src/components/AdminSettlementModal.tsx
git commit -m "feat(ui): update AdminSettlementModal for field collection remittance verification"
```

---

### Task 5: Admin & Marketing Portal Integration (`src/app/admin/page.tsx`)

**Files:**
- Modify: `src/app/admin/page.tsx:230-800`

**Interfaces:**
- Consumes: `venues: Venue[]`, `currentUser: AuthSession`
- Produces:
  - Super Admin: Executive card **"Piutang Setoran Marketing"** calculating `sum(platform_remittance_due)` of unverified venues.
  - Marketing Specialist: Executive cards **"Total Deal di Tangan"**, **"Hak Bersih Saya"**, and **"Wajib Setor ke Kantor"**.
  - Venue Table: Column **"Status Setoran"** with badges (`Belum Disetor`, `Menunggu Cek`, `Lunas Diverifikasi`) and contextual buttons.

- [x] **Step 1: Update Super Admin Executive Cards**

Replace *"Hutang Payout Belum Dibayar"* with *"Piutang Setoran Marketing"*:
```tsx
  const totalUnremittedPlatformDue = venueCalculations
    .filter((c) => (c.venue.remittance_status || c.venue.profit_share_status) !== 'verified' && (c.venue.remittance_status || c.venue.profit_share_status) !== 'paid')
    .reduce((acc, c) => acc + c.dist.platform_remittance_due, 0);
```
Card title: `Piutang Setoran Marketing`
Value: `Rp {totalUnremittedPlatformDue.toLocaleString('id-ID')}`
Subtitle: `Uang kas kantor yang menunggu ditransfer tim lapangan`

- [x] **Step 2: Update Marketing Specialist Personal Cards**

In the specialist view, calculate:
```tsx
  const myTotalCashHandled = venueCalculations.reduce((acc, c) => acc + (Number(c.venue.deal_amount) || 0), 0);
  const myTotalRetained = venueCalculations.reduce((acc, c) => acc + c.dist.marketing_retained, 0);
  const myTotalDueToPlatform = venueCalculations
    .filter((c) => (c.venue.remittance_status || c.venue.profit_share_status) !== 'verified' && (c.venue.remittance_status || c.venue.profit_share_status) !== 'paid')
    .reduce((acc, c) => acc + c.dist.platform_remittance_due, 0);
```
Display 3 clear metrics:
1. **Total Deal Diterima di Tangan**: `Rp {myTotalCashHandled}`
2. **Hak Bersih Saya**: `Rp {myTotalRetained}` (sudah dinikmati langsung)
3. **Wajib Setor ke Kantor**: `Rp {myTotalDueToPlatform}`

- [x] **Step 3: Update Venue Table Columns & Actions**

In table header, replace *"Pelunasan Payout (Opsi B)"* with *"Status Setoran"*.
For each row, render status badge:
- `remittance_status === 'verified'`: Badge Green `Lunas Disetor`
- `remittance_status === 'submitted'`: Badge Amber `Menunggu Cek Admin`
- Otherwise: Badge Rose `Belum Disetor (Wajib Setor: Rp X)`

Action button:
- For Super Admin: Button *"Verifikasi Setoran"* opens `AdminSettlementModal`.
- For Marketing Specialist: Button *"Setor ke Kantor"* opens modal to submit transfer notes/reference.

- [x] **Step 4: Run full test suite**

Run: `npm test`
Expected: All 18 test files PASS, 0 failures.

- [x] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): update executive dashboard and venue table for field remittance tracking"
```

---

## Plan Self-Review Checklist

1. **Spec Coverage:**
   - [x] Client transfers to marketing specialist accounted for.
   - [x] Monthly retainer remains direct to website bank account (no changes to `PaymentModal`).
   - [x] Auto-calculation of `platform_remittance_due` and `marketing_retained`.
   - [x] Action for Marketing to confirm remittance transfer with notes.
   - [x] Action for Super Admin to verify remittance against bank statement.
2. **Placeholder Scan:** Zero instances of TBD, TODO, or generic "implement later".
3. **Type Consistency:** `RemittanceStatus` defined in Task 1 and consistently referenced across Tasks 2, 3, 4, and 5.
