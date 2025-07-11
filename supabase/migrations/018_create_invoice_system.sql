-- Invoice Management System Migration
-- Migration: 018_create_invoice_system.sql

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Customer Information
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  customer_city VARCHAR(100),
  customer_state VARCHAR(100),
  customer_pincode VARCHAR(10),
  customer_country VARCHAR(100) DEFAULT 'India',
  customer_gst_number VARCHAR(50),
  
  -- Hotel Information
  hotel_name VARCHAR(200) NOT NULL DEFAULT 'Hotel Pride',
  hotel_address TEXT NOT NULL DEFAULT 'Hotel Pride Address',
  hotel_city VARCHAR(100) NOT NULL DEFAULT 'Your City',
  hotel_state VARCHAR(100) NOT NULL DEFAULT 'Your State',
  hotel_pincode VARCHAR(10) NOT NULL DEFAULT '000000',
  hotel_country VARCHAR(100) NOT NULL DEFAULT 'India',
  hotel_phone VARCHAR(20),
  hotel_email VARCHAR(255),
  hotel_gst_number VARCHAR(50),
  hotel_website VARCHAR(255),
  
  -- Invoice Settings
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Status and Notes
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Related Booking
  booking_id UUID REFERENCES bookings(id),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- INVOICE LINE ITEMS TABLE
-- =====================================================
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item Details
  item_type VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (item_type IN ('room', 'food', 'service', 'extra', 'discount', 'other')),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Tax Information
  tax_rate DECIMAL(5,2) DEFAULT 0.00, -- e.g., 12.00 for 12%
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_inclusive BOOLEAN DEFAULT false,
  tax_name VARCHAR(50) DEFAULT 'GST',
  
  -- Discount
  discount_rate DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Additional metadata
  item_date DATE,
  sort_order INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INVOICE PAYMENTS TABLE
-- =====================================================
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other')),
  reference_number VARCHAR(100),
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_item_type ON invoice_line_items(item_type);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Update updated_at timestamp
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next invoice number for the current year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%';
  
  -- Format: INV-YYYY-NNNN
  invoice_number := 'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  calc_subtotal DECIMAL(12,2) := 0.00;
  calc_total_tax DECIMAL(12,2) := 0.00;
  calc_total_discount DECIMAL(12,2) := 0.00;
  calc_total_amount DECIMAL(12,2) := 0.00;
  calc_paid_amount DECIMAL(12,2) := 0.00;
  calc_balance_amount DECIMAL(12,2) := 0.00;
BEGIN
  -- Calculate subtotal, tax, and discount from line items
  SELECT 
    COALESCE(SUM(line_total), 0.00),
    COALESCE(SUM(tax_amount), 0.00),
    COALESCE(SUM(discount_amount), 0.00)
  INTO calc_subtotal, calc_total_tax, calc_total_discount
  FROM invoice_line_items
  WHERE invoice_id = invoice_uuid;
  
  -- Calculate total amount
  calc_total_amount := calc_subtotal + calc_total_tax - calc_total_discount;
  
  -- Calculate paid amount
  SELECT COALESCE(SUM(amount), 0.00)
  INTO calc_paid_amount
  FROM invoice_payments
  WHERE invoice_id = invoice_uuid;
  
  -- Calculate balance
  calc_balance_amount := calc_total_amount - calc_paid_amount;
  
  -- Update invoice totals
  UPDATE invoices
  SET 
    subtotal = calc_subtotal,
    total_tax = calc_total_tax,
    total_discount = calc_total_discount,
    total_amount = calc_total_amount,
    paid_amount = calc_paid_amount,
    balance_amount = calc_balance_amount,
    payment_status = CASE
      WHEN calc_paid_amount = 0 THEN 'pending'
      WHEN calc_paid_amount >= calc_total_amount THEN 'paid'
      ELSE 'partial'
    END,
    updated_at = NOW()
  WHERE id = invoice_uuid;
END;
$$;

-- Trigger to recalculate totals when line items change
CREATE OR REPLACE FUNCTION trigger_calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_invoice_totals(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_invoice_totals(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER invoice_line_items_calculate_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_invoice_totals();

-- Trigger to recalculate totals when payments change
CREATE OR REPLACE FUNCTION trigger_calculate_invoice_totals_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_invoice_totals(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_invoice_totals(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER invoice_payments_calculate_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_invoice_totals_payments();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Users can create invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Users can delete invoices" ON invoices FOR DELETE USING (true);

-- Invoice line items policies
CREATE POLICY "Users can view invoice line items" ON invoice_line_items FOR SELECT USING (true);
CREATE POLICY "Users can create invoice line items" ON invoice_line_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update invoice line items" ON invoice_line_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete invoice line items" ON invoice_line_items FOR DELETE USING (true);

-- Invoice payments policies
CREATE POLICY "Users can view invoice payments" ON invoice_payments FOR SELECT USING (true);
CREATE POLICY "Users can create invoice payments" ON invoice_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update invoice payments" ON invoice_payments FOR UPDATE USING (true);
CREATE POLICY "Users can delete invoice payments" ON invoice_payments FOR DELETE USING (true);
