-- Migration: Make google_review_url optional for pre-printed stock stands
ALTER TABLE venues ALTER COLUMN google_review_url DROP NOT NULL;
ALTER TABLE venues ALTER COLUMN google_review_url SET DEFAULT '';

COMMENT ON COLUMN venues.google_review_url IS 'Target Google Review URL (optional for pre-fabricated stock QR stands until sold)';
