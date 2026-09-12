-- Migration: Add hpp (Harga Pokok Penjualan / Modal Produksi) to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS hpp NUMERIC DEFAULT 150000;

-- Backfill existing venues without hpp
UPDATE venues
SET hpp = 150000
WHERE hpp IS NULL;
