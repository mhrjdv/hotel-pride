-- Migration 022 - Enhance hotel_config with system-settings columns
-- (Rewritten to be compatible with the schema created in 020. The original
-- version targeted the pre-020 column names — gst_rate, address_line1, id=1 —
-- which no longer exist after 020 recreated the table, and used an integer id
-- against a UUID primary key. The app-expected legacy column names are added
-- and backfilled in migration 023.)

ALTER TABLE hotel_config
  ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS show_bank_details_default boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled_default boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS invoice_footer_text text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- Sensible buffet defaults for any future inserts.
ALTER TABLE hotel_config
  ALTER COLUMN buffet_breakfast_price SET DEFAULT 250,
  ALTER COLUMN buffet_lunch_price SET DEFAULT 350,
  ALTER COLUMN buffet_dinner_price SET DEFAULT 400;

CREATE INDEX IF NOT EXISTS idx_hotel_config_updated_at ON hotel_config(updated_at);

-- Backfill the system-settings columns on the existing single config row.
UPDATE hotel_config
SET
  default_currency = COALESCE(default_currency, 'INR'),
  show_bank_details_default = COALESCE(show_bank_details_default, true),
  email_enabled_default = COALESCE(email_enabled_default, true),
  country = COALESCE(country, 'India'),
  invoice_footer_text = COALESCE(invoice_footer_text, 'Thank you for choosing our hotel services.'),
  updated_at = NOW();
