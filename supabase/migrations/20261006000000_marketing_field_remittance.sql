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
