-- Migration: Add billing_type to venues table
-- Allows marketing specialist to select 'one_time' (Lifetime) or 'subscription' (Monthly Retainer)

ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'subscription' CHECK (billing_type IN ('one_time', 'subscription'));

-- Backfill existing venues based on monthly_retainer_fee
UPDATE venues 
SET billing_type = CASE 
  WHEN monthly_retainer_fee = 0 THEN 'one_time' 
  ELSE 'subscription' 
END 
WHERE billing_type IS NULL;
