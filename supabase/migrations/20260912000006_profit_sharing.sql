-- Migration: Add profit sharing and flexible HPP reimbursement columns to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS hpp_payer VARCHAR(20) DEFAULT 'marketing',
ADD COLUMN IF NOT EXISTS hpp_marketing_ratio NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS transport_fee NUMERIC DEFAULT 20000;

-- Ensure default values for any legacy records
UPDATE venues
SET hpp_payer = 'marketing'
WHERE hpp_payer IS NULL;

UPDATE venues
SET hpp_marketing_ratio = 100
WHERE hpp_marketing_ratio IS NULL;

UPDATE venues
SET transport_fee = 20000
WHERE transport_fee IS NULL;
