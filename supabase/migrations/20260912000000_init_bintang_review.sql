-- Migration: Bintang Review Core Schema with RLS & Initial Seed

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

-- Enable Row Level Security (RLS)
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- 1. venues: Public can read, authenticated or anon with client can insert/update
DROP POLICY IF EXISTS "Allow public read access to venues" ON venues;
CREATE POLICY "Allow public read access to venues" ON venues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage access to venues" ON venues;
CREATE POLICY "Allow manage access to venues" ON venues FOR ALL USING (true) WITH CHECK (true);

-- 2. scan_logs: Public can insert customer taps and read analytics
DROP POLICY IF EXISTS "Allow public insert to scan_logs" ON scan_logs;
CREATE POLICY "Allow public insert to scan_logs" ON scan_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to scan_logs" ON scan_logs;
CREATE POLICY "Allow read access to scan_logs" ON scan_logs FOR SELECT USING (true);

-- 3. feedback_messages: Public can insert complaints and read for portal inbox
DROP POLICY IF EXISTS "Allow public insert to feedback_messages" ON feedback_messages;
CREATE POLICY "Allow public insert to feedback_messages" ON feedback_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to feedback_messages" ON feedback_messages;
CREATE POLICY "Allow read access to feedback_messages" ON feedback_messages FOR SELECT USING (true);

-- 4. sales_agents: Public/admin can read and manage
DROP POLICY IF EXISTS "Allow read access to sales_agents" ON sales_agents;
CREATE POLICY "Allow read access to sales_agents" ON sales_agents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage access to sales_agents" ON sales_agents;
CREATE POLICY "Allow manage access to sales_agents" ON sales_agents FOR ALL USING (true) WITH CHECK (true);

-- Initial Seed Data
INSERT INTO sales_agents (id, name, phone_whatsapp, email, commission_type, commission_rate, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Budi Santoso (Partner BD)', '628123456789', 'budi@bintangreview.id', 'percentage', 20.00, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO venues (id, slug, name, logo_url, google_review_url, redirect_mode, feedback_channels, whatsapp_number, feedback_email, owner_access_pin, is_active, sales_id, deal_amount, monthly_retainer_fee)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'kopi-senja',
  'Kopi Senja Utama',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
  'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  'smart_funnel',
  'both',
  '628123456789',
  'manager@kopisenja.com',
  '1234',
  true,
  '00000000-0000-0000-0000-000000000001',
  599000,
  49000
)
ON CONFLICT (slug) DO NOTHING;
