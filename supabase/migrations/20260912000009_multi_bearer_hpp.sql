-- Migration: Add hpp_bearers JSONB column for arbitrary multi-bearer HPP split
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS hpp_bearers JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN venues.hpp_bearers IS 'List of HPP bearers [{ id, type, specialist_id, name, amount, ratio, reimburse_status, profit_share_status, ... }]';
