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
