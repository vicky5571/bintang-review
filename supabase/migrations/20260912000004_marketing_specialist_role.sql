-- Migration: Add access_pin to sales_agents table for Marketing Specialist portal login
ALTER TABLE sales_agents
ADD COLUMN IF NOT EXISTS access_pin VARCHAR(20) DEFAULT '1234';

-- Backfill any existing agents without pin
UPDATE sales_agents
SET access_pin = '1234'
WHERE access_pin IS NULL;
