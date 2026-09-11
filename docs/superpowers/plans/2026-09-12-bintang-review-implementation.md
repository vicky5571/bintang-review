# Bintang Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, ultra-low latency review management platform for Indonesian F&B and local businesses, pairing NFC/QR smart stands with a dynamic routing engine (`/r/:slug`), owner monitoring portal (`/portal/:slug`), and developer super-admin (`/admin`).

**Architecture:** Next.js 15 (App Router, TypeScript) with Edge Middleware for sub-150ms redirects, combined with Supabase PostgreSQL (with in-memory repository fallback for rapid local dev & testing), Tailwind CSS with custom Indonesian cafe-grade mobile UI tokens, and high-resolution QR/NFC asset generation.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Vitest, qrcode.

**Spec:** [docs/superpowers/specs/2026-09-12-bintang-review-design.md](file:///Users/mac/Web%20Development/bintang-review/docs/superpowers/specs/2026-09-12-bintang-review-design.md)

## Global Constraints
- Target market: Indonesian cafes & local merchants (Bahasa Indonesia UI copy, phone formatting: `628...`, Rupiah currency: `IDR / Rp`).
- Tap speed: Customer redirect/landing page must render or redirect in <1 second on mobile networks.
- 4-5 stars: 100% forwarded to Google Maps review URL.
- 1-3 stars: Intercepted privately and formatted for WhatsApp manager chat or saved to feedback inbox.
- No placeholders: All code blocks in tasks are complete and immediately executable.

---

### Task 1: Project Setup & Test Harness Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/app/globals.css`
- Test: `tests/scaffold.test.ts`

**Interfaces:**
- Consumes: Node.js standard runtime & npm dependencies.
- Produces: Executable Vitest test runner and working Next.js 15 build toolchain.

- [ ] **Step 1: Write the failing scaffold test**

Create `tests/scaffold.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Project Toolchain & Environment', () => {
  it('should verify Node environment and test runner are functional', () => {
    const isConfigured = true;
    expect(isConfigured).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (missing dependencies/runner)**

Run: `npx vitest run tests/scaffold.test.ts`  
Expected: FAIL or error indicating vitest is not installed.

- [ ] **Step 3: Write configuration files and install dependencies**

Create `package.json`:
```json
{
  "name": "bintang-review",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "^15.2.0",
    "qrcode": "^1.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.5",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vitest": "^3.0.7"
  }
}
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Create `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
```

Install dependencies:
`npm install`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit scaffolding**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs vitest.config.ts src/app/globals.css tests/scaffold.test.ts package-lock.json
git commit -m "chore: setup Next.js 15, Tailwind CSS, TypeScript, and Vitest"
```

---

### Task 2: Data Models, PostgreSQL Migration & Store Repository

**Files:**
- Create: `supabase/migrations/20260912000000_init_bintang_review.sql`
- Create: `src/lib/types.ts`
- Create: `src/lib/store.ts`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: Standard TypeScript types.
- Produces:
  - `Venue`, `SalesAgent`, `ScanLog`, `FeedbackMessage` types.
  - `dataStore.getVenueBySlug(slug: string): Promise<Venue | null>`
  - `dataStore.createVenue(venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue>`
  - `dataStore.updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null>`
  - `dataStore.listVenues(): Promise<Venue[]>`
  - `dataStore.logScan(scan: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog>`
  - `dataStore.saveFeedback(feedback: Omit<FeedbackMessage, 'id' | 'created_at'>): Promise<FeedbackMessage>`
  - `dataStore.getVenueAnalytics(venueId: string): Promise<VenueAnalytics>`
  - `dataStore.listSalesAgents(): Promise<SalesAgentSummary[]>`

- [ ] **Step 1: Write the failing test for Store Repository**

Create `tests/store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';

describe('DataStore Repository', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should retrieve seeded venue by slug', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();
    expect(venue?.slug).toBe('kopi-senja');
    expect(venue?.name).toBe('Kopi Senja Utama');
    expect(venue?.redirect_mode).toBe('smart_funnel');
  });

  it('should log a scan and calculate venue analytics correctly', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    await dataStore.logScan({
      venue_id: venue!.id,
      device_type: 'iOS',
      action_taken: 'positive_review',
      rating_selected: 5,
    });

    await dataStore.logScan({
      venue_id: venue!.id,
      device_type: 'Android',
      action_taken: 'negative_feedback',
      rating_selected: 2,
    });

    const analytics = await dataStore.getVenueAnalytics(venue!.id);
    expect(analytics.total_scans).toBe(2);
    expect(analytics.positive_count).toBe(1);
    expect(analytics.negative_count).toBe(1);
    expect(analytics.satisfaction_rate).toBe(50);
  });

  it('should save private feedback message', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    const msg = await dataStore.saveFeedback({
      venue_id: venue!.id,
      customer_name: 'Budi',
      customer_contact: '081234567890',
      table_number: '05',
      rating: 2,
      message: 'Kopinya agak asam dan ac kurang dingin.',
    });

    expect(msg.id).toBeDefined();
    expect(msg.message).toContain('Kopinya agak asam');

    const list = await dataStore.listFeedback(venue!.id);
    expect(list.length).toBe(1);
    expect(list[0].customer_name).toBe('Budi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL with "Cannot find module '@/lib/store'"

- [ ] **Step 3: Implement SQL migration, TypeScript types, and Store Repository**

Create `supabase/migrations/20260912000000_init_bintang_review.sql`:
```sql
-- Migration: Bintang Review Core Schema

CREATE TABLE IF NOT EXISTS sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  email TEXT,
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed_amount')) DEFAULT 'percentage',
  commission_rate NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  google_review_url TEXT NOT NULL,
  redirect_mode TEXT CHECK (redirect_mode IN ('smart_funnel', 'direct_google')) DEFAULT 'smart_funnel',
  feedback_channels TEXT CHECK (feedback_channels IN ('whatsapp', 'email', 'both')) DEFAULT 'whatsapp',
  whatsapp_number TEXT,
  feedback_email TEXT,
  owner_access_pin TEXT NOT NULL DEFAULT '1234',
  is_active BOOLEAN DEFAULT TRUE,
  sales_id UUID REFERENCES sales_agents(id) ON DELETE SET NULL,
  deal_amount NUMERIC(12, 2) DEFAULT 0,
  monthly_retainer_fee NUMERIC(12, 2) DEFAULT 0,
  deal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  device_type TEXT,
  action_taken TEXT CHECK (action_taken IN ('direct_redirect', 'funnel_opened', 'positive_review', 'negative_feedback')),
  rating_selected INT
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_contact TEXT,
  table_number TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 3),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_scan_logs_venue_time ON scan_logs (venue_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_venue_time ON feedback_messages (venue_id, created_at DESC);
```

Create `src/lib/types.ts`:
```typescript
export type RedirectMode = 'smart_funnel' | 'direct_google';
export type FeedbackChannel = 'whatsapp' | 'email' | 'both';
export type ActionTaken = 'direct_redirect' | 'funnel_opened' | 'positive_review' | 'negative_feedback';

export interface SalesAgent {
  id: string;
  name: string;
  phone_whatsapp: string;
  email?: string;
  commission_type: 'percentage' | 'fixed_amount';
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  google_review_url: string;
  redirect_mode: RedirectMode;
  feedback_channels: FeedbackChannel;
  whatsapp_number?: string;
  feedback_email?: string;
  owner_access_pin: string;
  is_active: boolean;
  sales_id?: string;
  deal_amount: number;
  monthly_retainer_fee: number;
  deal_date: string;
  created_at: string;
  updated_at: string;
}

export interface ScanLog {
  id: string;
  venue_id: string;
  scanned_at: string;
  device_type?: string;
  action_taken: ActionTaken;
  rating_selected?: number;
}

export interface FeedbackMessage {
  id: string;
  venue_id: string;
  customer_name?: string;
  customer_contact?: string;
  table_number?: string;
  rating: number;
  message: string;
  created_at: string;
}

export interface VenueAnalytics {
  total_scans: number;
  positive_count: number;
  negative_count: number;
  direct_count: number;
  satisfaction_rate: number;
  today_scans: number;
}

export interface SalesAgentSummary extends SalesAgent {
  total_venues: number;
  total_revenue: number;
  earned_commission: number;
}
```

Create `src/lib/store.ts`:
```typescript
import {
  Venue,
  SalesAgent,
  ScanLog,
  FeedbackMessage,
  VenueAnalytics,
  SalesAgentSummary,
} from './types';

// In-Memory Data Store with default mock venue for local development & testing
class InMemoryStore {
  private salesAgents: SalesAgent[] = [
    {
      id: 'agent-1',
      name: 'Budi Santoso (Partner BD)',
      phone_whatsapp: '628123456789',
      email: 'budi@bintangreview.id',
      commission_type: 'percentage',
      commission_rate: 20,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  private venues: Venue[] = [
    {
      id: 'venue-1',
      slug: 'kopi-senja',
      name: 'Kopi Senja Utama',
      logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      redirect_mode: 'smart_funnel',
      feedback_channels: 'both',
      whatsapp_number: '628123456789',
      feedback_email: 'manager@kopisenja.com',
      owner_access_pin: '1234',
      is_active: true,
      sales_id: 'agent-1',
      deal_amount: 599000,
      monthly_retainer_fee: 49000,
      deal_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  private scanLogs: ScanLog[] = [];
  private feedbackMessages: FeedbackMessage[] = [];

  reset() {
    this.scanLogs = [];
    this.feedbackMessages = [];
  }

  async getVenueBySlug(slug: string): Promise<Venue | null> {
    const venue = this.venues.find((v) => v.slug.toLowerCase() === slug.toLowerCase());
    return venue ? { ...venue } : null;
  }

  async getVenueById(id: string): Promise<Venue | null> {
    const venue = this.venues.find((v) => v.id === id);
    return venue ? { ...venue } : null;
  }

  async listVenues(): Promise<Venue[]> {
    return [...this.venues];
  }

  async createVenue(data: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue> {
    const newVenue: Venue = {
      ...data,
      id: `venue-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.venues.push(newVenue);
    return { ...newVenue };
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
    const index = this.venues.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.venues[index] = {
      ...this.venues[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...this.venues[index] };
  }

  async logScan(data: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog> {
    const log: ScanLog = {
      ...data,
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      scanned_at: new Date().toISOString(),
    };
    this.scanLogs.push(log);
    return { ...log };
  }

  async saveFeedback(data: Omit<FeedbackMessage, 'id' | 'created_at'>): Promise<FeedbackMessage> {
    const feedback: FeedbackMessage = {
      ...data,
      id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    this.feedbackMessages.push(feedback);
    return { ...feedback };
  }

  async listFeedback(venueId: string): Promise<FeedbackMessage[]> {
    return this.feedbackMessages
      .filter((f) => f.venue_id === venueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getVenueAnalytics(venueId: string): Promise<VenueAnalytics> {
    const logs = this.scanLogs.filter((l) => l.venue_id === venueId);
    const today = new Date().toISOString().split('T')[0];

    const total_scans = logs.length;
    const positive_count = logs.filter((l) => l.action_taken === 'positive_review').length;
    const negative_count = logs.filter((l) => l.action_taken === 'negative_feedback').length;
    const direct_count = logs.filter((l) => l.action_taken === 'direct_redirect').length;
    const today_scans = logs.filter((l) => l.scanned_at.startsWith(today)).length;

    const rated_total = positive_count + negative_count;
    const satisfaction_rate = rated_total > 0 ? Math.round((positive_count / rated_total) * 100) : 100;

    return {
      total_scans,
      positive_count,
      negative_count,
      direct_count,
      satisfaction_rate,
      today_scans,
    };
  }

  async listSalesAgents(): Promise<SalesAgentSummary[]> {
    return this.salesAgents.map((agent) => {
      const agentVenues = this.venues.filter((v) => v.sales_id === agent.id);
      const total_venues = agentVenues.length;
      const total_revenue = agentVenues.reduce((sum, v) => sum + (Number(v.deal_amount) || 0), 0);
      const earned_commission =
        agent.commission_type === 'percentage'
          ? (total_revenue * agent.commission_rate) / 100
          : total_venues * agent.commission_rate;

      return {
        ...agent,
        total_venues,
        total_revenue,
        earned_commission,
      };
    });
  }
}

export const dataStore = new InMemoryStore();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All tests in `tests/store.test.ts` and `tests/scaffold.test.ts` pass)

- [ ] **Step 5: Commit data layer**

```bash
git add supabase/migrations/20260912000000_init_bintang_review.sql src/lib/types.ts src/lib/store.ts tests/store.test.ts
git commit -m "feat: add schema migration, TypeScript types, and in-memory store repository"
```

---

### Task 3: Customer Tap Journey & Smart Funnel Engine (`/r/:slug`)

**Files:**
- Create: `src/app/api/tap/route.ts`
- Create: `src/app/api/feedback/route.ts`
- Create: `src/app/r/[slug]/page.tsx`
- Create: `src/components/FunnelRating.tsx`
- Create: `src/components/PrivateFeedbackModal.tsx`
- Test: `tests/funnel.test.ts`

**Interfaces:**
- Consumes: `dataStore.getVenueBySlug(slug)` and `dataStore.logScan()` from `src/lib/store`.
- Produces:
  - Interactive 5-star rating selector with haptic feedback.
  - Automatic forward to Google Review for 4-5 stars.
  - WhatsApp prefilled message formatter & modal for 1-3 stars.
  - POST `/api/tap` for asynchronous scan logging.
  - POST `/api/feedback` for saving private customer feedback.

- [ ] **Step 1: Write test for WhatsApp message formatting and funnel redirection rules**

Create `tests/funnel.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formatWhatsAppFeedbackUrl } from '@/components/PrivateFeedbackModal';

describe('Smart Funnel Business Logic', () => {
  it('should format WhatsApp complaint URL properly with Indonesian message and encoded parameters', () => {
    const url = formatWhatsAppFeedbackUrl({
      whatsappNumber: '628123456789',
      venueName: 'Kopi Senja Utama',
      rating: 2,
      tableNumber: '12',
      customerName: 'Siti',
      message: 'Pelayanan agak lama',
    });

    expect(url).toContain('https://wa.me/628123456789?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Halo Manajemen Kopi Senja Utama');
    expect(decoded).toContain('Rating: 2/5');
    expect(decoded).toContain('Meja: 12');
    expect(decoded).toContain('Siti');
    expect(decoded).toContain('Pelayanan agak lama');
  });

  it('should clean non-numeric characters from WhatsApp phone numbers', () => {
    const url = formatWhatsAppFeedbackUrl({
      whatsappNumber: '+62 812-3456-7890',
      venueName: 'Kopi Senja',
      rating: 1,
      message: 'AC mati',
    });
    expect(url).toContain('https://wa.me/6281234567890?text=');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/funnel.test.ts`  
Expected: FAIL with "Cannot find module '@/components/PrivateFeedbackModal'"

- [ ] **Step 3: Implement API routes and Customer Tap components**

Create `src/app/api/tap/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, actionTaken, ratingSelected, deviceType } = body;

    if (!venueId || !actionTaken) {
      return NextResponse.json({ error: 'venueId and actionTaken are required' }, { status: 400 });
    }

    const log = await dataStore.logScan({
      venue_id: venueId,
      action_taken: actionTaken,
      rating_selected: ratingSelected,
      device_type: deviceType || 'Unknown',
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

Create `src/app/api/feedback/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, customerName, customerContact, tableNumber, rating, message } = body;

    if (!venueId || !rating || !message) {
      return NextResponse.json({ error: 'venueId, rating, and message are required' }, { status: 400 });
    }

    const saved = await dataStore.saveFeedback({
      venue_id: venueId,
      customer_name: customerName,
      customer_contact: customerContact,
      table_number: tableNumber,
      rating,
      message,
    });

    return NextResponse.json({ success: true, feedback: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

Create `src/components/PrivateFeedbackModal.tsx`:
```typescript
'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Venue } from '@/lib/types';

export function formatWhatsAppFeedbackUrl(params: {
  whatsappNumber: string;
  venueName: string;
  rating: number;
  tableNumber?: string;
  customerName?: string;
  message: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace(/\D/g, '');
  const lines = [
    `*Halo Manajemen ${params.venueName}*`,
    `Saya pelanggan ingin menyampaikan kritik/saran terkait pelayanan:`,
    ``,
    `⭐ *Rating:* ${params.rating}/5`,
    params.tableNumber ? `📍 *Meja:* ${params.tableNumber}` : '',
    params.customerName ? `👤 *Nama:* ${params.customerName}` : '',
    `💬 *Pesan:*`,
    params.message,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

interface PrivateFeedbackModalProps {
  venue: Venue;
  rating: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateFeedbackModal({ venue, rating, isOpen, onClose }: PrivateFeedbackModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    // Save to Database
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          customerName,
          tableNumber,
          rating,
          message,
        }),
      });

      // Log negative feedback scan
      await fetch('/api/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          actionTaken: 'negative_feedback',
          ratingSelected: rating,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    // If channel is whatsapp or both, launch WhatsApp
    if ((venue.feedback_channels === 'whatsapp' || venue.feedback_channels === 'both') && venue.whatsapp_number) {
      const waUrl = formatWhatsAppFeedbackUrl({
        whatsappNumber: venue.whatsapp_number,
        venueName: venue.name,
        rating,
        tableNumber,
        customerName,
        message,
      });
      window.location.href = waUrl;
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xl">🙏</span>
            <h3 className="font-bold text-slate-800">Beri Masukan untuk Manajemen</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800">Terima Kasih Atas Masukan Anda</h4>
            <p className="text-sm text-slate-500 mt-1">Masukan Anda telah diteruskan langsung ke tim manajemen {venue.name}.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <p className="text-xs text-slate-500">
              Kritik dan saran Anda sangat berharga agar kami dapat memberikan pelayanan yang lebih baik.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-600">Nama (Opsional)</label>
                <input
                  type="text"
                  placeholder="Mis: Siti"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">No Meja (Opsional)</label>
                <input
                  type="text"
                  placeholder="Mis: 07"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Pesan Masukan / Keluhan *</label>
              <textarea
                required
                rows={3}
                placeholder="Ceritakan apa yang bisa kami tingkatkan..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              {venue.feedback_channels === 'whatsapp' || venue.feedback_channels === 'both' ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Kirim ke WhatsApp Manajemen
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Masukan Pribadi
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

Create `src/components/FunnelRating.tsx`:
```typescript
'use client';

import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Venue } from '@/lib/types';
import { PrivateFeedbackModal } from './PrivateFeedbackModal';

interface FunnelRatingProps {
  venue: Venue;
}

export function FunnelRating({ venue }: FunnelRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);

  const handleRatingSelect = async (stars: number) => {
    setSelectedRating(stars);

    // Haptic vibration feedback on mobile phones
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    if (stars >= 4) {
      setIsRedirecting(true);
      try {
        // Log positive scan to analytics
        await fetch('/api/tap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId: venue.id,
            actionTaken: 'positive_review',
            ratingSelected: stars,
          }),
        });
      } catch (e) {
        console.error(e);
      }

      // Smooth auto forward to Google Maps Review
      setTimeout(() => {
        window.location.replace(venue.google_review_url);
      }, 900);
    } else {
      // 1 to 3 stars: Open private feedback modal
      setIsPrivateModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Brand Header */}
      <div className="flex flex-col items-center">
        {venue.logo_url ? (
          <img
            src={venue.logo_url}
            alt={venue.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-lg mb-4">
            {venue.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{venue.name}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Bagaimana pengalaman Anda bersama kami hari ini?
        </p>
      </div>

      {/* Interactive Stars */}
      <div className="mt-8 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-100">
        <div className="flex justify-center items-center gap-2 sm:gap-3 py-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || selectedRating || 0) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingSelect(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 sm:p-2 transition transform hover:scale-125 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                    isFilled ? 'fill-amber-400 text-amber-400 filter drop-shadow' : 'text-slate-200'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <p className="text-xs font-medium text-slate-400 mt-4">
          Ketuk bintang untuk menilai (1 - 5)
        </p>
      </div>

      {/* 4-5 Stars Thank You Micro-Modal */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Luar Biasa!</h3>
            <p className="text-xs text-slate-500 mt-2">
              Terima kasih atas penilaian bintang 5 Anda. Mengalihkan ke Google Maps Review...
            </p>
          </div>
        </div>
      )}

      {/* 1-3 Stars Private Feedback Modal */}
      {selectedRating && selectedRating <= 3 && (
        <PrivateFeedbackModal
          venue={venue}
          rating={selectedRating}
          isOpen={isPrivateModalOpen}
          onClose={() => setIsPrivateModalOpen(false)}
        />
      )}
    </div>
  );
}
```

Create `src/app/r/[slug]/page.tsx`:
```typescript
import { notFound, redirect } from 'next/navigation';
import { dataStore } from '@/lib/store';
import { FunnelRating } from '@/components/FunnelRating';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerTapPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await dataStore.getVenueBySlug(slug);

  if (!venue || !venue.is_active) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md text-center">
          <div className="text-4xl mb-3">☕</div>
          <h1 className="text-lg font-bold text-slate-800">Layanan Sedang Diperbarui</h1>
          <p className="text-sm text-slate-500 mt-1">
            Silakan hubungi kasir atau staf cafe untuk informasi lebih lanjut.
          </p>
        </div>
      </main>
    );
  }

  // 1-Click Direct Google Bypass Mode
  if (venue.redirect_mode === 'direct_google') {
    // Log direct redirect
    await dataStore.logScan({
      venue_id: venue.id,
      action_taken: 'direct_redirect',
      device_type: 'Mobile',
    });
    redirect(venue.google_review_url);
  }

  // Smart Funnel Mode
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/50 to-slate-100 flex flex-col justify-center px-4 py-12">
      <FunnelRating venue={venue} />
      <footer className="text-center mt-12 text-xs text-slate-400">
        Didukung oleh <span className="font-semibold text-slate-600">Bintang Review</span>
      </footer>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All tests in `tests/funnel.test.ts`, `tests/store.test.ts`, `tests/scaffold.test.ts` pass)

- [ ] **Step 5: Commit customer funnel engine**

```bash
git add src/app/api/tap/route.ts src/app/api/feedback/route.ts src/components/PrivateFeedbackModal.tsx src/components/FunnelRating.tsx src/app/r/[slug]/page.tsx tests/funnel.test.ts
git commit -m "feat: implement customer tap funnel with haptics and WhatsApp routing"
```

---

### Task 4: High-Resolution QR & NFC Asset Generator Module

**Files:**
- Create: `src/lib/qr.ts`
- Create: `src/components/QrGeneratorModal.tsx`
- Test: `tests/qr.test.ts`

**Interfaces:**
- Consumes: Venue slug and base domain string.
- Produces:
  - `generateQrSvgString(url: string): Promise<string>`
  - `generateNfcPayload(slug: string, baseUrl?: string): string`
  - High-res downloadable SVG & PNG asset modal.

- [ ] **Step 1: Write test for QR and NFC generator utility**

Create `tests/qr.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateNfcPayload, generateQrSvgString } from '@/lib/qr';

describe('QR & NFC Asset Generator', () => {
  it('should generate correct NFC URL payload', () => {
    const nfcUrl = generateNfcPayload('kopi-senja', 'https://bintangreview.id');
    expect(nfcUrl).toBe('https://bintangreview.id/r/kopi-senja');
  });

  it('should generate a valid SVG string from target URL', async () => {
    const svg = await generateQrSvgString('https://bintangreview.id/r/kopi-senja');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/qr.test.ts`  
Expected: FAIL with "Cannot find module '@/lib/qr'"

- [ ] **Step 3: Implement QR & NFC generator**

Create `src/lib/qr.ts`:
```typescript
import QRCode from 'qrcode';

export function generateNfcPayload(slug: string, baseUrl = 'https://bintangreview.id'): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/r/${slug}`;
}

export async function generateQrSvgString(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}
```

Create `src/components/QrGeneratorModal.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, X, QrCode, Smartphone } from 'lucide-react';
import { Venue } from '@/lib/types';
import { generateNfcPayload, generateQrDataUrl, generateQrSvgString } from '@/lib/qr';

interface QrGeneratorModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QrGeneratorModal({ venue, isOpen, onClose }: QrGeneratorModalProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!venue) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bintangreview.id';
    const targetUrl = generateNfcPayload(venue.slug, origin);

    generateQrSvgString(targetUrl).then(setSvgContent);
    generateQrDataUrl(targetUrl).then(setPngDataUrl);
  }, [venue]);

  if (!isOpen || !venue) return null;

  const targetUrl = typeof window !== 'undefined'
    ? generateNfcPayload(venue.slug, window.location.origin)
    : `https://bintangreview.id/r/${venue.slug}`;

  const copyNfc = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${venue.slug}-print.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `QR-${venue.slug}-print-1024px.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800">Aset QR & NFC — {venue.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-6 items-center">
          {/* QR Preview */}
          <div className="w-48 h-48 p-2 border-2 border-slate-100 rounded-2xl shadow-inner bg-white flex items-center justify-center">
            {pngDataUrl ? (
              <img src={pngDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-slate-400">Rendering QR...</div>
            )}
          </div>

          {/* NFC & Print Actions */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dynamic NFC URL</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  readOnly
                  value={targetUrl}
                  className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={copyNfc}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-800 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-amber-500" /> Tulis URL ini ke chip NTAG213 via aplikasi NFC Tools.
              </p>
            </div>

            <div className="pt-2 border-t flex flex-col gap-2">
              <button
                onClick={downloadPng}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-3.5 h-3.5" /> Unduh PNG High-Res (1024px)
              </button>
              <button
                onClick={downloadSvg}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Vektor SVG (Untuk Cetak UV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All test suites pass)

- [ ] **Step 5: Commit QR & NFC generator**

```bash
git add src/lib/qr.ts src/components/QrGeneratorModal.tsx tests/qr.test.ts
git commit -m "feat: add high-res QR code generator and NFC payload copy modal"
```

---

### Task 5: Owner Monitoring Portal (`/portal/:slug`)

**Files:**
- Create: `src/app/portal/[slug]/page.tsx`
- Create: `src/components/OwnerPinModal.tsx`
- Create: `src/components/OwnerDashboardView.tsx`
- Test: `tests/portal.test.ts`

**Interfaces:**
- Consumes: `dataStore.getVenueBySlug(slug)`, `dataStore.getVenueAnalytics(venueId)`, `dataStore.listFeedback(venueId)`.
- Produces:
  - PIN gate verification (matching `venue.owner_access_pin`).
  - Live KPI cards: Total Scans, Satisfaction Rate (%), Saved Google Reviews.
  - Chronological Customer Feedback Inbox.
  - Done-For-You Concierge Floating Bar to contact developer.

- [ ] **Step 1: Write test for Owner PIN verification and metric calculation**

Create `tests/portal.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { verifyOwnerPin } from '@/components/OwnerPinModal';

describe('Owner Portal Authentication & Metrics', () => {
  it('should validate owner access PIN correctly', () => {
    const valid = verifyOwnerPin('1234', '1234');
    const invalid = verifyOwnerPin('9999', '1234');
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/portal.test.ts`  
Expected: FAIL with "Cannot find module '@/components/OwnerPinModal'"

- [ ] **Step 3: Implement Owner Portal components**

Create `src/components/OwnerPinModal.tsx`:
```typescript
'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export function verifyOwnerPin(inputPin: string, correctPin: string): boolean {
  return inputPin.trim() === correctPin.trim();
}

interface OwnerPinModalProps {
  venueName: string;
  correctPin: string;
  onSuccess: () => void;
}

export function OwnerPinModal({ venueName, correctPin, onSuccess }: OwnerPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPin(pin, correctPin)) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Owner Portal</h2>
        <p className="text-xs text-slate-500 mt-1">{venueName}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Masukkan 4-Digit PIN Akses
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className="w-full text-center tracking-widest text-2xl py-3 border-2 rounded-xl font-bold focus:border-amber-500 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-500 font-medium mt-2">PIN salah, silakan coba lagi</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Buka Portal <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

Create `src/components/OwnerDashboardView.tsx`:
```typescript
'use client';

import React from 'react';
import { Venue, VenueAnalytics, FeedbackMessage } from '@/lib/types';
import { Star, MessageCircle, BarChart3, ShieldCheck, PhoneCall } from 'lucide-react';

interface OwnerDashboardViewProps {
  venue: Venue;
  analytics: VenueAnalytics;
  feedbacks: FeedbackMessage[];
}

export function OwnerDashboardView({ venue, analytics, feedbacks }: OwnerDashboardViewProps) {
  const supportWaUrl = `https://wa.me/628123456789?text=${encodeURIComponent(
    `Halo Tim Bintang Review, saya owner ${venue.name} (slug: ${venue.slug}) ingin meminta bantuan layanan:`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {venue.logo_url && (
            <img src={venue.logo_url} alt={venue.name} className="w-10 h-10 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-lg font-black text-slate-800">{venue.name}</h1>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Stand Akrilik Aktif
            </span>
          </div>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
          Read-Only Portal
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Total Tap & Scan</span>
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-slate-900">{analytics.total_scans}</div>
            <p className="text-xs text-slate-400 mt-1">Hari ini: +{analytics.today_scans} tap</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Tingkat Kepuasan</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-500">{analytics.satisfaction_rate}%</div>
            <p className="text-xs text-slate-400 mt-1">Rating 4-5 bintang langsung ke Google</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Ulasan Negatif Tersaring</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{analytics.negative_count}</div>
            <p className="text-xs text-slate-400 mt-1">Berhasil ditampung privat sebelum ke publik</p>
          </div>
        </div>

        {/* Feedback Inbox */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-800">Inbox Masukan Pelanggan (Bintang 1 - 3)</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{feedbacks.length} masukan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {feedbacks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                🎉 Belum ada keluhan atau ulasan negatif. Pelayanan Anda luar biasa!
              </div>
            ) : (
              feedbacks.map((item) => (
                <div key={item.id} className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {item.customer_name || 'Pelanggan Anonim'}
                      </span>
                      {item.table_number && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          Meja {item.table_number}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{item.message}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Done-For-You Floating Concierge Bar */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-20">
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
          <div className="text-xs">
            <p className="font-semibold">Butuh bantuan atau ingin ubah link Google?</p>
            <p className="text-slate-400 text-[11px]">Tim concierge Bintang Review siap membantu.</p>
          </div>
          <a
            href={supportWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl transition whitespace-nowrap shadow"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Chat Concierge
          </a>
        </div>
      </div>
    </div>
  );
}
```

Create `src/app/portal/[slug]/page.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Venue, VenueAnalytics, FeedbackMessage } from '@/lib/types';
import { dataStore } from '@/lib/store';
import { OwnerPinModal } from '@/components/OwnerPinModal';
import { OwnerDashboardView } from '@/components/OwnerDashboardView';

export default function OwnerPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const v = await dataStore.getVenueBySlug(slug);
      if (v) {
        setVenue(v);
        const an = await dataStore.getVenueAnalytics(v.id);
        setAnalytics(an);
        const fb = await dataStore.listFeedback(v.id);
        setFeedbacks(fb);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Memuat portal...</div>;
  }

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Venue tidak ditemukan.</div>;
  }

  if (!isAuthenticated) {
    return (
      <OwnerPinModal
        venueName={venue.name}
        correctPin={venue.owner_access_pin}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <OwnerDashboardView
      venue={venue}
      analytics={analytics!}
      feedbacks={feedbacks}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All test suites pass)

- [ ] **Step 5: Commit owner portal**

```bash
git add src/components/OwnerPinModal.tsx src/components/OwnerDashboardView.tsx src/app/portal/[slug]/page.tsx tests/portal.test.ts
git commit -m "feat: implement owner monitoring portal with PIN authentication and live KPI inbox"
```

---

### Task 6: Developer Super Admin Portal (`/admin`)

**Files:**
- Create: `src/components/AdminVenueModal.tsx`
- Create: `src/app/admin/page.tsx`
- Test: `tests/admin.test.ts`

**Interfaces:**
- Consumes: `dataStore.listVenues()`, `dataStore.createVenue()`, `dataStore.updateVenue()`, `dataStore.listSalesAgents()`.
- Produces:
  - Venue overview table with search, mode badges, scan statistics, and edit controls.
  - Create/Edit venue modal with sales attribution & mode toggles.
  - QR asset viewer modal integration.
  - Sales & Commission Ledger.

- [ ] **Step 1: Write test for venue creation and mode switching**

Create `tests/admin.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';

describe('Admin Management Operations', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should create a new client venue with custom slug and settings', async () => {
    const venue = await dataStore.createVenue({
      slug: 'warung-kopi-sedap',
      name: 'Warung Kopi Sedap',
      google_review_url: 'https://maps.google.com/review',
      redirect_mode: 'direct_google',
      feedback_channels: 'whatsapp',
      whatsapp_number: '628987654321',
      owner_access_pin: '5678',
      is_active: true,
      deal_amount: 499000,
      monthly_retainer_fee: 49000,
      deal_date: '2026-09-12',
    });

    expect(venue.id).toBeDefined();
    expect(venue.slug).toBe('warung-kopi-sedap');
    expect(venue.redirect_mode).toBe('direct_google');
  });

  it('should toggle venue status between active and inactive', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    const updated = await dataStore.updateVenue(venue!.id, { is_active: false });
    expect(updated?.is_active).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test tests/admin.test.ts`  
Expected: PASS

- [ ] **Step 3: Implement Admin Venue Modal and Super Admin Page**

Create `src/components/AdminVenueModal.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Venue, SalesAgentSummary } from '@/lib/types';
import { X, Save, Plus } from 'lucide-react';

interface AdminVenueModalProps {
  venue: Venue | null;
  isOpen: boolean;
  salesAgents: SalesAgentSummary[];
  onClose: () => void;
  onSave: (data: Partial<Venue>) => void;
}

export function AdminVenueModal({ venue, isOpen, salesAgents, onClose, onSave }: AdminVenueModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    google_review_url: '',
    redirect_mode: 'smart_funnel' as const,
    feedback_channels: 'whatsapp' as const,
    whatsapp_number: '',
    owner_access_pin: '1234',
    is_active: true,
    sales_id: '',
    deal_amount: 599000,
    monthly_retainer_fee: 49000,
  });

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name,
        slug: venue.slug,
        google_review_url: venue.google_review_url,
        redirect_mode: venue.redirect_mode,
        feedback_channels: venue.feedback_channels,
        whatsapp_number: venue.whatsapp_number || '',
        owner_access_pin: venue.owner_access_pin,
        is_active: venue.is_active,
        sales_id: venue.sales_id || '',
        deal_amount: venue.deal_amount,
        monthly_retainer_fee: venue.monthly_retainer_fee,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        google_review_url: '',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        whatsapp_number: '',
        owner_access_pin: '1234',
        is_active: true,
        sales_id: salesAgents[0]?.id || '',
        deal_amount: 599000,
        monthly_retainer_fee: 49000,
      });
    }
  }, [venue, salesAgents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="font-bold text-slate-800">
            {venue ? `Edit Venue — ${venue.name}` : 'Tambah Klien / Venue Baru'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Nama Venue *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-xl"
                placeholder="Kopi Senja"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Slug URL *</label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono"
                placeholder="kopi-senja"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">Google Review Write URL *</label>
            <input
              required
              type="url"
              value={formData.google_review_url}
              onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-xl font-mono text-xs"
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Mode Routing</label>
              <select
                value={formData.redirect_mode}
                onChange={(e) => setFormData({ ...formData, redirect_mode: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="smart_funnel">Smart Funnel (1-5 Star)</option>
                <option value="direct_google">Direct Google (1-Click Bypass)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Kanal Masukan Privat</label>
              <select
                value={formData.feedback_channels}
                onChange={(e) => setFormData({ ...formData, feedback_channels: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="whatsapp">WhatsApp Manager Chat</option>
                <option value="email">Email / Inbox Saja</option>
                <option value="both">Keduanya (WhatsApp + Email)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">WhatsApp Manager (62...)</label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono"
                placeholder="628123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Owner Access PIN</label>
              <input
                required
                type="text"
                maxLength={6}
                value={formData.owner_access_pin}
                onChange={(e) => setFormData({ ...formData, owner_access_pin: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono text-center tracking-wider"
                placeholder="1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Sales Agent Attribution</label>
              <select
                value={formData.sales_id}
                onChange={(e) => setFormData({ ...formData, sales_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="">-- Pilih Sales Agent --</option>
                {salesAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.commission_rate}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Deal Package Amount (Rp)</label>
              <input
                type="number"
                value={formData.deal_amount}
                onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-xl"
                placeholder="599000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-medium text-slate-700">Status Stand Akrilik Aktif</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-800 active:scale-95"
            >
              {venue ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {venue ? 'Simpan Perubahan' : 'Buat Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

Create `src/app/admin/page.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Venue, SalesAgentSummary } from '@/lib/types';
import { dataStore } from '@/lib/store';
import { Plus, QrCode, ExternalLink, ShieldCheck, DollarSign, Store } from 'lucide-react';
import { AdminVenueModal } from '@/components/AdminVenueModal';
import { QrGeneratorModal } from '@/components/QrGeneratorModal';

export default function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgentSummary[]>([]);
  const [selectedVenueForEdit, setSelectedVenueForEdit] = useState<Venue | null>(null);
  const [selectedVenueForQr, setSelectedVenueForQr] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const loadData = async () => {
    const vList = await dataStore.listVenues();
    setVenues(vList);
    const saList = await dataStore.listSalesAgents();
    setSalesAgents(saList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveVenue = async (formData: Partial<Venue>) => {
    if (selectedVenueForEdit) {
      await dataStore.updateVenue(selectedVenueForEdit.id, formData);
    } else {
      await dataStore.createVenue(formData as any);
    }
    setIsModalOpen(false);
    setSelectedVenueForEdit(null);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <div>
            <h1 className="text-lg font-black tracking-tight">Bintang Review — Super Admin</h1>
            <p className="text-xs text-slate-400">Developer & Agency Management Console</p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedVenueForEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Tambah Klien Venue
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        {/* Venues Table Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-800">Daftar Klien Kafe & Venue ({venues.length})</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
                <tr>
                  <th className="px-6 py-3">Nama Venue</th>
                  <th className="px-6 py-3">Slug & Tap Link</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">PIN Owner</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`/r/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-mono text-xs flex items-center gap-1 hover:underline"
                      >
                        /r/{v.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          v.redirect_mode === 'smart_funnel'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {v.redirect_mode === 'smart_funnel' ? '⭐ Smart Funnel' : '⚡ 1-Click Direct'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{v.owner_access_pin}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          v.is_active ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${v.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {v.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVenueForQr(v);
                          setIsQrModalOpen(true);
                        }}
                        className="p-2 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                        title="Download QR & NFC"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVenueForEdit(v);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-800 font-medium text-xs rounded-lg hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <a
                        href={`/portal/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800"
                      >
                        Portal
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales & Commission Dashboard */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800">Mesin Komisi Sales & Referral Partner</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {salesAgents.map((agent) => (
              <div key={agent.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{agent.name}</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    {agent.commission_rate}%
                  </span>
                </div>
                <div className="text-xs text-slate-500">Venue Terjual: {agent.total_venues} kafe</div>
                <div className="text-xs text-slate-500">
                  Total Deal: Rp {agent.total_revenue.toLocaleString('id-ID')}
                </div>
                <div className="pt-2 border-t font-bold text-sm text-emerald-700">
                  Komisi Berhak Diterima: Rp {agent.earned_commission.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Edit / Create Modal */}
      <AdminVenueModal
        venue={selectedVenueForEdit}
        isOpen={isModalOpen}
        salesAgents={salesAgents}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVenueForEdit(null);
        }}
        onSave={handleSaveVenue}
      />

      {/* QR & NFC Asset Viewer */}
      <QrGeneratorModal
        venue={selectedVenueForQr}
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedVenueForQr(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All test suites pass)

- [ ] **Step 5: Commit Super Admin**

```bash
git add src/components/AdminVenueModal.tsx src/app/admin/page.tsx tests/admin.test.ts
git commit -m "feat: implement super admin with venue CRUD, mode toggle, and commission dashboard"
```

---

### Task 7: End-to-End Flow & Production Build Verification

**Files:**
- Create: `tests/e2e-flow.test.ts`

**Interfaces:**
- Consumes: All modules (`dataStore`, `qr`, `funnel`, `portal`).
- Produces: 100% verified test coverage across the whole customer and merchant lifecycle, passing `npm run build`.

- [ ] **Step 1: Write comprehensive integration flow test**

Create `tests/e2e-flow.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { generateNfcPayload, generateQrSvgString } from '@/lib/qr';
import { formatWhatsAppFeedbackUrl } from '@/components/PrivateFeedbackModal';

describe('Bintang Review Complete E2E Lifecycle', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should complete full cycle: admin creates venue -> QR generated -> customer taps & rates 5 -> analytics updated', async () => {
    // 1. Admin creates new client venue
    const venue = await dataStore.createVenue({
      slug: 'kopi-kenangan-senopati',
      name: 'Kopi Kenangan Senopati',
      google_review_url: 'https://maps.google.com/review/kopi-kenangan',
      redirect_mode: 'smart_funnel',
      feedback_channels: 'both',
      whatsapp_number: '628111222333',
      owner_access_pin: '4321',
      is_active: true,
      deal_amount: 599000,
      monthly_retainer_fee: 49000,
      deal_date: '2026-09-12',
    });

    expect(venue.id).toBeDefined();

    // 2. Hardware QR & NFC generated
    const nfcUrl = generateNfcPayload(venue.slug);
    const svg = await generateQrSvgString(nfcUrl);
    expect(nfcUrl).toContain('/r/kopi-kenangan-senopati');
    expect(svg).toContain('<svg');

    // 3. Customer taps and leaves 5-star rating
    await dataStore.logScan({
      venue_id: venue.id,
      device_type: 'iOS Mobile',
      action_taken: 'positive_review',
      rating_selected: 5,
    });

    // 4. Another customer leaves 2-star constructive criticism
    await dataStore.saveFeedback({
      venue_id: venue.id,
      customer_name: 'Dewi',
      table_number: '03',
      rating: 2,
      message: 'Kursinya agak berdebu',
    });
    await dataStore.logScan({
      venue_id: venue.id,
      device_type: 'Android Mobile',
      action_taken: 'negative_feedback',
      rating_selected: 2,
    });

    // 5. Owner checks analytics on portal
    const analytics = await dataStore.getVenueAnalytics(venue.id);
    expect(analytics.total_scans).toBe(2);
    expect(analytics.positive_count).toBe(1);
    expect(analytics.negative_count).toBe(1);
    expect(analytics.satisfaction_rate).toBe(50);

    const feedbacks = await dataStore.listFeedback(venue.id);
    expect(feedbacks.length).toBe(1);
    expect(feedbacks[0].customer_name).toBe('Dewi');

    // 6. Test WhatsApp routing formatter
    const waUrl = formatWhatsAppFeedbackUrl({
      whatsappNumber: venue.whatsapp_number!,
      venueName: venue.name,
      rating: 2,
      tableNumber: '03',
      customerName: 'Dewi',
      message: 'Kursinya agak berdebu',
    });
    expect(waUrl).toContain('628111222333');
    expect(decodeURIComponent(waUrl)).toContain('Kursinya agak berdebu');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test`  
Expected: PASS (All test suites pass)

- [ ] **Step 3: Run production build verification**

Run: `npm run build`  
Expected: Next.js production build completes with zero TypeScript or compilation errors.

- [ ] **Step 4: Commit E2E verification**

```bash
git add tests/e2e-flow.test.ts
git commit -m "test: add full lifecycle e2e integration test"
```
