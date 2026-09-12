-- Migration: Add optional hpp_marketing_amount to store exact Rupiah nominal borne by marketing
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS hpp_marketing_amount NUMERIC;

-- Backfill existing venues: compute exact rupiah based on hpp and hpp_marketing_ratio
UPDATE venues
SET hpp_marketing_amount = ROUND((COALESCE(hpp, 150000) * COALESCE(hpp_marketing_ratio, 100)) / 100)
WHERE hpp_marketing_amount IS NULL;
