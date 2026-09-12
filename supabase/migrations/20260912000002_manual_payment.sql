-- Migration: Manual Payment Confirmation & Subscription Verification Engine

-- 1. Add subscription tracking columns to venues
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'pending_verification', 'expired')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- 2. Create payment_confirmations table
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 49000,
  payment_method TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  proof_url TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for rapid verification queries
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_venue ON payment_confirmations(venue_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);

-- 4. Row Level Security (RLS)
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Public anon: Can submit payment confirmation
CREATE POLICY "Allow public insert payment_confirmations"
ON payment_confirmations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service role: Full access for Super Admin verification
CREATE POLICY "Allow service role full access to payment_confirmations"
ON payment_confirmations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
