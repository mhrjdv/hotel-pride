-- Migration 023 - Reconcile hotel_config with the columns the app actually uses.
--
-- Background: the app was developed against the JSON mock DB, so its only direct
-- hotel_config consumer — src/app/api/hotel/config/route.ts — reads/writes the
-- original 001-style column names (address_line1, city, state, pin_code, phone,
-- email, website, gst_number, gst_rate) plus a few system flags. Migration 020,
-- however, recreated hotel_config with hotel_* names. This migration adds the
-- app-expected legacy columns and backfills them from the 020 hotel_* columns so
-- the single config row is consistent. The unused hotel_* columns are left in
-- place (harmless) to avoid breaking 020's get_hotel_config() rowtype dependency.

ALTER TABLE hotel_config
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 12;

-- Backfill the app-style columns from the 020 hotel_* columns where present.
UPDATE hotel_config SET
  address_line1 = COALESCE(address_line1, hotel_address),
  city          = COALESCE(city, hotel_city),
  state         = COALESCE(state, hotel_state),
  pin_code      = COALESCE(pin_code, hotel_pincode),
  phone         = COALESCE(phone, hotel_phone),
  email         = COALESCE(email, hotel_email),
  website       = COALESCE(website, hotel_website),
  gst_number    = COALESCE(gst_number, hotel_gst_number),
  gst_rate      = COALESCE(gst_rate, default_gst_rate, 12);
