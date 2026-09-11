# Bintang Review — System Design & Product Specification

**Project**: Bintang Review  
**Date**: 2026-09-12  
**Status**: Approved Concept (Ready for Implementation)  
**Target Market**: Cafes, Restaurants, F&B, Salons, Clinics, and Local Businesses in Indonesia  

---

## 1. Executive Summary & Value Proposition

**Bintang Review** is a hybrid physical-digital solution combining smart acrylic table stands (embedded with NFC chips and printed QR codes) with a dynamic cloud-redirection and review management platform.

### Core Value Proposition:
1. **Effortless 5-Star Reviews**: Customers tap their smartphone or scan the QR code at tables or cashiers. Positive feedback (4–5 stars) is instantly channeled to Google Maps Reviews.
2. **Reputation Protection ("Smart Review Funnel")**: Constructive criticism or negative feedback (1–3 stars) is captured privately and routed to cafe management (via WhatsApp, Email, or both), shielding the business's public Google rating.
3. **1-Click Direct Bypass**: For clients who want direct Google Maps ratings without the funnel, developer can toggle 1-click bypass mode.
4. **Lifetime Hardware (Dynamic Links)**: The acrylic stands hold permanent dynamic short URLs. Destination links, phone numbers, or operational modes can be updated remotely at any time without replacing or reprogramming physical stands.
5. **Done-For-You Agency Model with Owner Transparency**:
   - **Developer Super Admin**: Full control over venue links, QR generation, NFC configuration, and client statuses.
   - **Owner Monitoring Portal (Read-Only)**: Cafe owners get transparent live proof of ROI (scans, conversion ratios, feedback inbox) protected by a PIN, while keeping link management locked to the developer.
6. **Built-in Sales & Commission Engine**: Direct tracking of which sales agent closed which cafe deal, with automated commission calculations.

---

## 2. System Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │             PHYSICAL TOUCHPOINT (AT VENUE)              │
   │   • Acrylic Stand (2mm/3mm Cast Acrylic, UV Print)      │
   │   • Embedded NTAG213/215 NFC Chip                       │
   │   • High-Res Printed QR Code                            │
   └────────────────────────────┬────────────────────────────┘
                                │ Tap / Scan
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                     ROUTING ENGINE                      │
   │             `bintangreview.id/r/:slug`                  │
   └─────────────┬─────────────────────────────┬─────────────┘
                 │                             │
    [direct_google mode]              [smart_funnel mode]
                 │                             │
                 ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │   Instant Redirect (1s)   │ │  Mobile Rating Web Page   │
   │    Google Maps Review     │ │    (1 to 5 Star Rating)   │
   └───────────────────────────┘ └─────────────┬─────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
               Rating: 4 or 5 Stars                            Rating: 1, 2, or 3 Stars
                       │                                               │
                       ▼                                               ▼
            Thank You Micro-Modal                           Private Feedback Form
                       │                                               │
                       ▼                                   Based on `feedback_channels`:
               Google Maps Review                          ├── WhatsApp Manager Chat
                                                           ├── Email / Database Archive
                                                           └── Both Options
```

### Technology Choices (Option A - Scalable Edge Full-Stack):
* **Full-Stack Framework**: **Next.js 15 (App Router, TypeScript)**:
  * Edge Middleware (`middleware.ts`) for sub-150ms instant redirect on `/r/:slug` for `direct_google` mode without client blank-screen.
  * Ultra-lightweight Server & Client Components (<30KB client payload) for customer tap rating funnel.
  * Unified single-codebase architecture for Customer Tap, Owner Portal (`/portal/:slug`), and Super Admin (`/admin`).
* **Styling & UI**: **Tailwind CSS** dengan **Voney Money Manager** signature color palette (Dominasi Putih Bersih `#ffffff`, Aksen Lime Green `#84cc16`, Aksen Cyan `#06b6d4`, Gradasi Lime-to-Cyan `linear-gradient(135deg, #84cc16 0%, #10b981 45%, #06b6d4 100%)`, Tipografi Slate/Charcoal `#0f172a`, Gold Amber `#f59e0b` rating stars), modern typography, native haptic feedback (`navigator.vibrate`), dan smooth micro-animations.
* **Backend & Database**: **Supabase (PostgreSQL)**:
  * Fast REST APIs with Connection Pooling (PgBouncer/Supavisor) to handle peak rush-hour taps.
  * Built-in Row Level Security (RLS) for multi-tenant data protection.
  * Optimized composite indexing for `scan_logs (venue_id, scanned_at DESC)`.
* **Caching & Scalability Strategy**:
  * Edge Config / In-memory caching with on-demand tag revalidation (`revalidateTag`) for venue routing settings.
  * Asynchronous scan logging to ensure customer redirection is never blocked by database latency.
* **Hosting & CDN**: Edge deployment (Vercel / Cloudflare) with Southeast Asia edge PoPs (Jakarta / Singapore).

---

## 3. Database Schema

### 3.1. Table: `sales_agents`
Tracks sales representatives and referral partners for revenue share.
```sql
CREATE TABLE sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  email TEXT,
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed_amount')) DEFAULT 'percentage',
  commission_rate NUMERIC(10, 2) NOT NULL DEFAULT 20.00, -- e.g., 20% or Rp 50.000
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2. Table: `venues` (Clients / Cafes)
Stores configuration, routing mode, destination links, and sales attribution.
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                       -- e.g. "kopi-senja"
  name TEXT NOT NULL,                              -- e.g. "Kopi Senja Utama"
  logo_url TEXT,
  google_review_url TEXT NOT NULL,                 -- Direct Google Maps write-review link
  redirect_mode TEXT CHECK (redirect_mode IN ('smart_funnel', 'direct_google')) DEFAULT 'smart_funnel',
  feedback_channels TEXT CHECK (feedback_channels IN ('whatsapp', 'email', 'both')) DEFAULT 'whatsapp',
  whatsapp_number TEXT,                            -- Format: 628123456789
  feedback_email TEXT,                             -- e.g. manager@kopisenja.com
  owner_access_pin TEXT NOT NULL DEFAULT '1234',   -- 4-6 digit access PIN for Read-Only portal
  is_active BOOLEAN DEFAULT TRUE,                  -- Master pause/resume switch
  
  -- Sales & Business Attribution
  sales_id UUID REFERENCES sales_agents(id) ON DELETE SET NULL,
  deal_amount NUMERIC(12, 2) DEFAULT 0,            -- Initial hardware purchase total (e.g. 599000)
  monthly_retainer_fee NUMERIC(12, 2) DEFAULT 0,   -- Monthly recurring subscription (e.g. 49000)
  deal_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3. Table: `scan_logs`
Logs analytics for each tap and scan.
```sql
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  device_type TEXT,                                -- iOS / Android / Desktop
  action_taken TEXT CHECK (action_taken IN ('direct_redirect', 'funnel_opened', 'positive_review', 'negative_feedback')),
  rating_selected INT                              -- 1 to 5 (null if direct_google)
);
```

### 3.4. Table: `feedback_messages`
Stores private customer complaints and feedback (1–3 stars).
```sql
CREATE TABLE feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_contact TEXT,
  table_number TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 3),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. User Journeys & Portal Specifications

### 4.1. Customer Tap Journey (`/r/:slug`)
1. **Tap / Scan Event**: URL opens in mobile browser.
2. If `venue.is_active` is `false`: Displays maintenance page (*"Layanan sedang diperbarui, silakan hubungi kasir"*).
3. If `venue.redirect_mode` is `direct_google`: Instant client redirect (`window.location.replace(google_review_url)`).
4. If `venue.redirect_mode` is `smart_funnel`:
   - High-fidelity branded view with venue logo and welcoming greeting.
   - Interactive 5-star rating selector with haptic bounce animation.
   - **Selection 4–5 Stars**: Thank-you micro-modal appears, then auto-forwards to Google Maps Review.
   - **Selection 1–3 Stars**: Smoothly transitions to private feedback form.
     - Destination WhatsApp: Prefilled WhatsApp message formatted:
       `"Halo Manajemen [Nama Cafe], saya pelanggan ingin menyampaikan masukan terkait pelayanan: [Pesan] (Meja: [No Meja])"`.
     - Destination Email / Both: Direct submit to `feedback_messages` table with confirmation prompt.

### 4.2. Developer Super Admin (`/admin`)
Protected by admin master credentials.
* **Venue Overview**: Table of all client cafes with active badges, scan totals, and quick actions.
* **Create / Edit Venue Modal**:
  - Venue Name, Custom Slug, Logo URL.
  - Direct Google Review Link.
  - Redirection Mode Toggle (`smart_funnel` vs `direct_google`).
  - Feedback Channels Toggle (`whatsapp` / `email` / `both`).
  - WhatsApp Number & Email inputs.
  - Sales Attribution dropdown (select sales rep) & Deal Amount input.
  - Active Switch (`is_active`).
* **QR & NFC Asset Generator**:
  - Live preview of QR Code with downloadable SVG & high-resolution PNG.
  - One-click button to copy the exact URL for NFC tag programming.
* **Sales & Commission Management**:
  - List of sales agents with total closed venues, cumulative revenue, and earned commissions.

### 4.3. Owner Monitoring Portal (`/portal/:slug`)
Accessible via URL with a simple 4-6 digit PIN.
* **Header**: Cafe Logo, Venue Name, Active Status Badge.
* **Live KPI Cards**:
  - Total Taps & Scans (All-time, This Month, Today).
  - Positive Satisfaction Rate (% 4–5 Star ratings).
  - Private Feedback Count (% 1–3 Star ratings saved from Google).
* **Feedback Inbox**:
  - Clean chronological table/cards showing customer comments, ratings, table numbers, and timestamps.
* **Done-For-You Floating Action Bar**:
  - *"Ingin ganti link Google, ubah nomor WA, atau tambah akrilik meja? Hubungi Tim Bintang Review via WhatsApp"* with 1-click contact button.

---

## 5. Physical Hardware Specifications & Procurement

| Component | Recommended Specification | Supplier Notes (Indonesia) |
| :--- | :--- | :--- |
| **Acrylic Stand** | Cast Acrylic 2mm or 3mm thickness. Premium laser-cut polished edges. | Local acrylic workshops (Jakarta/Bandung/Surabaya). |
| **Form Factor** | Mini Table Tent (8x12 cm or 10x10 cm) or L-Stand / Wooden Base. | Compact footprint so it doesn't crowd cafe tables. |
| **Printing Method** | UV Flatbed Direct Print (CMYK + White ink). | Waterproof, alcohol-proof, scratch-resistant (no paper stickers). |
| **NFC Tag** | **NTAG213** or **NTAG215** Round Coin Sticker (25mm diameter). | Shopee / Tokopedia (Rp 2.000 – Rp 4.000 / pcs). |
| **Anti-Metal Note** | Anti-Metal ferrite layer required ONLY if placing on metal tables. | Standard tags for clear acrylic. |
| **Programming** | **NFC Tools** app on iOS / Android (Free). | Write URL in 3 seconds per stand. |

---

## 6. Business Model & Pricing Strategy

* **Starter Pack (1 Cashier Stand)**: Rp 149.000 – Rp 199.000.
* **Cafe Table Pack (1 Cashier + 5 Table Stands)**: Rp 499.000 – Rp 649.000.
* **Monthly SaaS Retainer (Optional)**: Rp 49.000 / month (Includes link update concierge, monthly review growth report, and server maintenance).
* **Sales Commission Scheme**: 15% – 25% of initial hardware deal to sales agent.

---

## 7. Verification & Success Criteria

1. **Tap / Scan Speed**: Redirect under 1 second on 4G Indonesian mobile networks.
2. **Review Funnel Accuracy**:
   - 4–5 stars redirect 100% of the time to the designated Google Maps review prompt.
   - 1–3 stars correctly trigger WhatsApp chat with pre-filled message and/or log feedback to database.
3. **Dynamic Flexibility**: Changing the Google link or WhatsApp number in Admin instantly takes effect on next tap without changing QR/NFC.
4. **Owner Security**: Owner can only view analytics and cannot alter core routing links.
