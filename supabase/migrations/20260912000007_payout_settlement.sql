-- Migration: Add payout settlement tracking for HPP reimbursement and profit sharing
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS hpp_reimburse_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS hpp_reimburse_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hpp_reimburse_notes TEXT,
ADD COLUMN IF NOT EXISTS profit_share_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS profit_share_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profit_share_notes TEXT;

-- For existing venues where platform bore 100% of HPP (hpp_marketing_ratio = 0 or hpp_payer = 'platform'),
-- set hpp_reimburse_status to 'not_applicable' because there is no modal to reimburse to marketing specialist.
UPDATE venues
SET hpp_reimburse_status = 'not_applicable'
WHERE hpp_payer = 'platform' OR hpp_marketing_ratio = 0;

-- Ensure remaining records have default 'unpaid'
UPDATE venues
SET hpp_reimburse_status = 'unpaid'
WHERE hpp_reimburse_status IS NULL;

UPDATE venues
SET profit_share_status = 'unpaid'
WHERE profit_share_status IS NULL;
