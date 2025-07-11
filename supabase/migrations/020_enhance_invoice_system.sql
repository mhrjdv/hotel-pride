-- Enhanced Invoice System Migration
-- Migration: 020_enhance_invoice_system.sql

-- =====================================================
-- HOTEL CONFIGURATION TABLE
-- =====================================================
CREATE TABLE hotel_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name VARCHAR(200) NOT NULL DEFAULT 'Hotel Pride',
  hotel_address TEXT NOT NULL,
  hotel_city VARCHAR(100) NOT NULL,
  hotel_state VARCHAR(100) NOT NULL,
  hotel_pincode VARCHAR(10) NOT NULL,
  hotel_country VARCHAR(100) NOT NULL DEFAULT 'India',
  hotel_phone VARCHAR(20),
  hotel_email VARCHAR(255),
  hotel_website VARCHAR(255),
  hotel_gst_number VARCHAR(50),
  hotel_pan_number VARCHAR(20),
  hotel_logo_url TEXT,
  
  -- Bank Details
  bank_name VARCHAR(200),
  bank_account_number VARCHAR(50),
  bank_ifsc_code VARCHAR(20),
  bank_branch VARCHAR(200),
  bank_account_holder_name VARCHAR(200),
  
  -- Invoice Settings
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  proforma_prefix VARCHAR(10) DEFAULT 'PI',
  default_gst_rate DECIMAL(5,2) DEFAULT 12.00,
  default_terms_and_conditions TEXT,
  
  -- Buffet Settings
  buffet_breakfast_price DECIMAL(10,2) DEFAULT 0.00,
  buffet_lunch_price DECIMAL(10,2) DEFAULT 0.00,
  buffet_dinner_price DECIMAL(10,2) DEFAULT 0.00,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default hotel configuration
INSERT INTO hotel_config (
  hotel_name, hotel_address, hotel_city, hotel_state, hotel_pincode,
  hotel_phone, hotel_email, hotel_gst_number,
  bank_name, bank_account_number, bank_ifsc_code, bank_branch, bank_account_holder_name,
  default_terms_and_conditions
) VALUES (
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'State Bank of India',
  '1234567890123456',
  'SBIN0001234',
  'Main Branch',
  'Hotel Pride Pvt Ltd',
  'Payment due within 15 days from invoice date. Late payment charges may apply. All disputes subject to local jurisdiction.'
);

-- =====================================================
-- CUSTOM ITEM TYPES TABLE
-- =====================================================
CREATE TABLE custom_item_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📋',
  default_gst_rate DECIMAL(5,2) DEFAULT 12.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default item types
INSERT INTO custom_item_types (name, description, icon, default_gst_rate, sort_order) VALUES
('Room Charges', 'Hotel room accommodation charges', '🏨', 12.00, 1),
('Food & Beverage', 'Restaurant and room service charges', '🍽️', 5.00, 2),
('Buffet Breakfast', 'Buffet breakfast per person', '🥐', 5.00, 3),
('Buffet Lunch', 'Buffet lunch per person', '🍛', 5.00, 4),
('Buffet Dinner', 'Buffet dinner per person', '🍽️', 5.00, 5),
('Service Charges', 'Additional service charges', '🛎️', 18.00, 6),
('Laundry', 'Laundry and dry cleaning', '👔', 18.00, 7),
('Transportation', 'Airport pickup, taxi services', '🚗', 5.00, 8),
('Extra Amenities', 'Extra bed, cot, amenities', '➕', 12.00, 9),
('Conference Hall', 'Meeting room and conference charges', '🏢', 18.00, 10),
('Spa & Wellness', 'Spa treatments and wellness services', '💆', 18.00, 11),
('Discount', 'Discounts and promotional offers', '💰', 0.00, 12),
('Other', 'Miscellaneous charges', '📋', 12.00, 13);

-- =====================================================
-- ENHANCE INVOICES TABLE
-- =====================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'proforma', 'estimate', 'quote'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_gst_number VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_pan_number VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_contact_person VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS show_bank_details BOOLEAN DEFAULT true;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_email_enabled BOOLEAN DEFAULT true;

-- =====================================================
-- ENHANCE INVOICE LINE ITEMS TABLE
-- =====================================================
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS custom_item_type_id UUID REFERENCES custom_item_types(id);
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS is_buffet_item BOOLEAN DEFAULT false;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS buffet_type VARCHAR(20) CHECK (buffet_type IN ('breakfast', 'lunch', 'dinner'));
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS persons_count INTEGER DEFAULT 1;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS price_per_person DECIMAL(10,2) DEFAULT 0.00;

-- Update existing line items to use GST instead of tax
UPDATE invoice_line_items SET tax_name = 'GST' WHERE tax_name IS NULL OR tax_name = '';

-- =====================================================
-- INVOICE TEMPLATES TABLE
-- =====================================================
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('invoice', 'proforma', 'estimate')),
  is_default BOOLEAN DEFAULT false,
  
  -- Template Settings
  show_logo BOOLEAN DEFAULT true,
  show_bank_details BOOLEAN DEFAULT true,
  show_gst_breakdown BOOLEAN DEFAULT true,
  show_payment_terms BOOLEAN DEFAULT true,
  show_amount_in_words BOOLEAN DEFAULT true,
  
  -- Styling
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  font_family VARCHAR(50) DEFAULT 'Arial',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default templates
INSERT INTO invoice_templates (name, description, template_type, is_default) VALUES
('Standard Invoice', 'Standard invoice template with all details', 'invoice', true),
('Proforma Invoice', 'Proforma invoice template for advance bookings', 'proforma', true),
('Estimate/Quote', 'Estimate template for quotations', 'estimate', true);

-- =====================================================
-- CUSTOMER INVOICES VIEW
-- =====================================================
CREATE OR REPLACE VIEW customer_invoices AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  i.id as invoice_id,
  i.invoice_number,
  i.invoice_type,
  i.invoice_date,
  i.due_date,
  i.total_amount,
  i.paid_amount,
  i.balance_amount,
  i.status,
  i.payment_status,
  i.created_at
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
ORDER BY i.created_at DESC;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get hotel configuration
CREATE OR REPLACE FUNCTION get_hotel_config()
RETURNS hotel_config
LANGUAGE plpgsql
AS $$
DECLARE
  config hotel_config;
BEGIN
  SELECT * INTO config FROM hotel_config WHERE is_active = true LIMIT 1;
  RETURN config;
END;
$$;

-- Function to generate invoice number based on type
CREATE OR REPLACE FUNCTION generate_invoice_number_by_type(inv_type VARCHAR(20) DEFAULT 'invoice')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
  prefix TEXT;
BEGIN
  -- Get prefix based on type
  SELECT 
    CASE 
      WHEN inv_type = 'proforma' THEN proforma_prefix
      ELSE invoice_prefix
    END
  INTO prefix
  FROM hotel_config 
  WHERE is_active = true 
  LIMIT 1;
  
  IF prefix IS NULL THEN
    prefix := CASE WHEN inv_type = 'proforma' THEN 'PI' ELSE 'INV' END;
  END IF;
  
  -- Get the next invoice number for the current year and type
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM prefix || '-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%'
  AND invoice_type = inv_type;
  
  -- Format: PREFIX-YYYY-NNNN
  invoice_number := prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$;

-- Function to calculate buffet line item
CREATE OR REPLACE FUNCTION calculate_buffet_line_item(
  buffet_type_param VARCHAR(20),
  persons_count_param INTEGER,
  gst_rate_param DECIMAL(5,2) DEFAULT 5.00
)
RETURNS TABLE(
  price_per_person DECIMAL(10,2),
  line_total DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  final_total DECIMAL(12,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  per_person_price DECIMAL(10,2);
  base_total DECIMAL(12,2);
  calculated_gst DECIMAL(12,2);
  final_amount DECIMAL(12,2);
BEGIN
  -- Get buffet price from hotel config
  SELECT 
    CASE 
      WHEN buffet_type_param = 'breakfast' THEN buffet_breakfast_price
      WHEN buffet_type_param = 'lunch' THEN buffet_lunch_price
      WHEN buffet_type_param = 'dinner' THEN buffet_dinner_price
      ELSE 0.00
    END
  INTO per_person_price
  FROM hotel_config
  WHERE is_active = true
  LIMIT 1;
  
  -- Calculate totals
  base_total := per_person_price * persons_count_param;
  calculated_gst := (base_total * gst_rate_param) / 100;
  final_amount := base_total + calculated_gst;
  
  RETURN QUERY SELECT per_person_price, base_total, calculated_gst, final_amount;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_hotel_config_updated_at
  BEFORE UPDATE ON hotel_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_item_types_updated_at
  BEFORE UPDATE ON custom_item_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE hotel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- Hotel config policies
CREATE POLICY "Users can view hotel config" ON hotel_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage hotel config" ON hotel_config FOR ALL USING (true);

-- Custom item types policies
CREATE POLICY "Users can view custom item types" ON custom_item_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage custom item types" ON custom_item_types FOR ALL USING (true);

-- Invoice templates policies
CREATE POLICY "Users can view invoice templates" ON invoice_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage invoice templates" ON invoice_templates FOR ALL USING (true);
