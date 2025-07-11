-- Migration: Enhance hotel_config table with new fields
-- Description: Add system settings, buffet pricing, and invoice configuration

-- Add new columns to hotel_config table
ALTER TABLE hotel_config 
ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS show_bank_details_default boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_enabled_default boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS invoice_footer_text text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- Update existing columns to ensure they have proper defaults
ALTER TABLE hotel_config 
ALTER COLUMN buffet_breakfast_price SET DEFAULT 250,
ALTER COLUMN buffet_lunch_price SET DEFAULT 350,
ALTER COLUMN buffet_dinner_price SET DEFAULT 400;

-- Ensure gst_rate has a proper default
ALTER TABLE hotel_config 
ALTER COLUMN gst_rate SET DEFAULT 12;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotel_config_updated_at ON hotel_config(updated_at);

-- Insert default configuration if none exists
INSERT INTO hotel_config (
  id,
  hotel_name,
  address_line1,
  city,
  state,
  pin_code,
  phone,
  email,
  gst_number,
  country,
  default_currency,
  gst_rate,
  show_bank_details_default,
  email_enabled_default,
  buffet_breakfast_price,
  buffet_lunch_price,
  buffet_dinner_price,
  default_terms_and_conditions,
  invoice_footer_text,
  created_at,
  updated_at
) 
SELECT 
  1,
  'Hotel Pride',
  'Enter your hotel address',
  'Enter city',
  'Enter state',
  '000000',
  '+91-0000000000',
  'hotel@example.com',
  'Enter GST Number',
  'India',
  'INR',
  12,
  true,
  true,
  250,
  350,
  400,
  'Payment due within 15 days from invoice date. Late payment charges may apply. All disputes subject to local jurisdiction.',
  'Thank you for choosing our hotel services.',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM hotel_config WHERE id = 1);

-- Update any existing records to have the new defaults
UPDATE hotel_config 
SET 
  default_currency = COALESCE(default_currency, 'INR'),
  show_bank_details_default = COALESCE(show_bank_details_default, true),
  email_enabled_default = COALESCE(email_enabled_default, true),
  country = COALESCE(country, 'India'),
  buffet_breakfast_price = COALESCE(buffet_breakfast_price, 250),
  buffet_lunch_price = COALESCE(buffet_lunch_price, 350),
  buffet_dinner_price = COALESCE(buffet_dinner_price, 400),
  gst_rate = COALESCE(gst_rate, 12),
  default_terms_and_conditions = COALESCE(
    default_terms_and_conditions, 
    'Payment due within 15 days from invoice date. Late payment charges may apply. All disputes subject to local jurisdiction.'
  ),
  invoice_footer_text = COALESCE(
    invoice_footer_text,
    'Thank you for choosing our hotel services.'
  ),
  updated_at = NOW()
WHERE id = 1;
