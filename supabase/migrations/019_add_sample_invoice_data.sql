-- Sample Invoice Data Migration
-- Migration: 019_add_sample_invoice_data.sql

-- Insert sample customers first (if they don't exist)
INSERT INTO customers (id, name, email, phone, address, city, state, pincode, country, id_type, id_number, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Rajesh Kumar', 'rajesh.kumar@email.com', '+919876543210', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'India', 'aadhaar', '123456789012', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Priya Sharma', 'priya.sharma@email.com', '+919876543211', '456 Park Street', 'Delhi', 'Delhi', '110001', 'India', 'pan', 'ABCDE1234F', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Amit Patel', 'amit.patel@email.com', '+919876543212', '789 Ring Road', 'Ahmedabad', 'Gujarat', '380001', 'India', 'passport', 'A1234567', NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Sunita Reddy', 'sunita.reddy@email.com', '+919876543213', '321 Tank Bund Road', 'Hyderabad', 'Telangana', '500001', 'India', 'driving_license', 'TG1234567890', NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Vikram Singh', 'vikram.singh@email.com', '+919876543214', '654 Mall Road', 'Jaipur', 'Rajasthan', '302001', 'India', 'voter_id', 'ABC1234567', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample bookings (if they don't exist)
INSERT INTO bookings (id, booking_number, room_id, primary_customer_id, check_in_date, check_out_date, check_in_time, check_out_time, total_guests, adults, children, room_rate, total_nights, base_amount, gst_amount, total_amount, paid_amount, due_amount, is_gst_inclusive, payment_status, booking_status, created_at)
SELECT 
  '660e8400-e29b-41d4-a716-446655440001',
  'BK20250101',
  r.id,
  '550e8400-e29b-41d4-a716-446655440001',
  '2025-01-15',
  '2025-01-17',
  '14:00:00',
  '11:00:00',
  2,
  2,
  0,
  3500.00,
  2,
  7000.00,
  840.00,
  7840.00,
  7840.00,
  0.00,
  false,
  'paid',
  'checked_out',
  NOW() - INTERVAL '5 days'
FROM rooms r WHERE r.room_number = '101'
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (id, booking_number, room_id, primary_customer_id, check_in_date, check_out_date, check_in_time, check_out_time, total_guests, adults, children, room_rate, total_nights, base_amount, gst_amount, total_amount, paid_amount, due_amount, is_gst_inclusive, payment_status, booking_status, created_at)
SELECT 
  '660e8400-e29b-41d4-a716-446655440002',
  'BK20250102',
  r.id,
  '550e8400-e29b-41d4-a716-446655440002',
  '2025-01-10',
  '2025-01-12',
  '14:00:00',
  '11:00:00',
  1,
  1,
  0,
  4200.00,
  2,
  8400.00,
  1008.00,
  9408.00,
  5000.00,
  4408.00,
  false,
  'partial',
  'checked_out',
  NOW() - INTERVAL '3 days'
FROM rooms r WHERE r.room_number = '201'
ON CONFLICT (id) DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (
  id, 
  invoice_number, 
  invoice_date, 
  due_date,
  customer_id,
  customer_name,
  customer_email,
  customer_phone,
  customer_address,
  customer_city,
  customer_state,
  customer_pincode,
  customer_country,
  hotel_name,
  hotel_address,
  hotel_city,
  hotel_state,
  hotel_pincode,
  hotel_country,
  hotel_phone,
  hotel_email,
  hotel_gst_number,
  currency,
  subtotal,
  total_tax,
  total_discount,
  total_amount,
  paid_amount,
  balance_amount,
  status,
  payment_status,
  notes,
  terms_and_conditions,
  booking_id,
  created_at
) VALUES 
-- Invoice 1 - Paid
(
  '770e8400-e29b-41d4-a716-446655440001',
  'INV-2025-0001',
  '2025-01-15',
  '2025-01-30',
  '550e8400-e29b-41d4-a716-446655440001',
  'Rajesh Kumar',
  'rajesh.kumar@email.com',
  '+919876543210',
  '123 MG Road',
  'Mumbai',
  'Maharashtra',
  '400001',
  'India',
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  'India',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'INR',
  7000.00,
  840.00,
  0.00,
  7840.00,
  7840.00,
  0.00,
  'paid',
  'paid',
  'Excellent stay, customer was very satisfied.',
  'Payment due within 15 days. Late payment charges may apply.',
  '660e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '5 days'
),
-- Invoice 2 - Partial Payment
(
  '770e8400-e29b-41d4-a716-446655440002',
  'INV-2025-0002',
  '2025-01-10',
  '2025-01-25',
  '550e8400-e29b-41d4-a716-446655440002',
  'Priya Sharma',
  'priya.sharma@email.com',
  '+919876543211',
  '456 Park Street',
  'Delhi',
  'Delhi',
  '110001',
  'India',
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  'India',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'INR',
  8400.00,
  1008.00,
  0.00,
  9408.00,
  5000.00,
  4408.00,
  'sent',
  'partial',
  'Customer requested extended stay.',
  'Payment due within 15 days. Late payment charges may apply.',
  '660e8400-e29b-41d4-a716-446655440002',
  NOW() - INTERVAL '3 days'
),
-- Invoice 3 - Draft
(
  '770e8400-e29b-41d4-a716-446655440003',
  'INV-2025-0003',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '15 days',
  '550e8400-e29b-41d4-a716-446655440003',
  'Amit Patel',
  'amit.patel@email.com',
  '+919876543212',
  '789 Ring Road',
  'Ahmedabad',
  'Gujarat',
  '380001',
  'India',
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  'India',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'INR',
  5600.00,
  672.00,
  200.00,
  6072.00,
  0.00,
  6072.00,
  'draft',
  'pending',
  'Corporate booking with discount applied.',
  'Payment due within 15 days. Late payment charges may apply.',
  NULL,
  NOW()
),
-- Invoice 4 - Overdue
(
  '770e8400-e29b-41d4-a716-446655440004',
  'INV-2025-0004',
  CURRENT_DATE - INTERVAL '20 days',
  CURRENT_DATE - INTERVAL '5 days',
  '550e8400-e29b-41d4-a716-446655440004',
  'Sunita Reddy',
  'sunita.reddy@email.com',
  '+919876543213',
  '321 Tank Bund Road',
  'Hyderabad',
  'Telangana',
  '500001',
  'India',
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  'India',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'INR',
  4500.00,
  540.00,
  0.00,
  5040.00,
  0.00,
  5040.00,
  'overdue',
  'pending',
  'Payment overdue. Please contact customer.',
  'Payment due within 15 days. Late payment charges may apply.',
  NULL,
  NOW() - INTERVAL '20 days'
),
-- Invoice 5 - Recent
(
  '770e8400-e29b-41d4-a716-446655440005',
  'INV-2025-0005',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '14 days',
  '550e8400-e29b-41d4-a716-446655440005',
  'Vikram Singh',
  'vikram.singh@email.com',
  '+919876543214',
  '654 Mall Road',
  'Jaipur',
  'Rajasthan',
  '302001',
  'India',
  'Hotel Pride',
  'Hotel Pride Address, Main Street',
  'Your City',
  'Your State',
  '000000',
  'India',
  '+91 9876543210',
  'info@hotelpride.com',
  '27ABCDE1234F1Z5',
  'INR',
  6300.00,
  756.00,
  300.00,
  6756.00,
  2000.00,
  4756.00,
  'sent',
  'partial',
  'VIP customer with special amenities.',
  'Payment due within 15 days. Late payment charges may apply.',
  NULL,
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample invoice line items
INSERT INTO invoice_line_items (
  id,
  invoice_id,
  item_type,
  description,
  quantity,
  unit_price,
  line_total,
  tax_rate,
  tax_amount,
  tax_inclusive,
  tax_name,
  discount_rate,
  discount_amount,
  sort_order
) VALUES
-- Invoice 1 Line Items
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'room', 'Deluxe AC Room - 2 Nights', 2, 3500.00, 7000.00, 12.00, 840.00, false, 'GST', 0.00, 0.00, 0),

-- Invoice 2 Line Items
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'room', 'Premium AC Room - 2 Nights', 2, 4200.00, 8400.00, 12.00, 1008.00, false, 'GST', 0.00, 0.00, 0),

-- Invoice 3 Line Items
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'room', 'Standard AC Room - 2 Nights', 2, 2800.00, 5600.00, 12.00, 672.00, false, 'GST', 0.00, 0.00, 0),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', 'discount', 'Corporate Discount', 1, -200.00, -200.00, 0.00, 0.00, false, 'GST', 0.00, 200.00, 1),

-- Invoice 4 Line Items
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004', 'room', 'Standard Non-AC Room - 3 Nights', 3, 1500.00, 4500.00, 12.00, 540.00, false, 'GST', 0.00, 0.00, 0),

-- Invoice 5 Line Items
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440005', 'room', 'VIP Suite - 2 Nights', 2, 3000.00, 6000.00, 12.00, 720.00, false, 'GST', 0.00, 0.00, 0),
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440005', 'food', 'Complimentary Breakfast', 2, 300.00, 600.00, 5.00, 30.00, false, 'GST', 0.00, 0.00, 1),
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440005', 'service', 'Airport Pickup', 1, 500.00, 500.00, 18.00, 90.00, false, 'GST', 0.00, 0.00, 2),
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440005', 'extra', 'Extra Bed', 1, 200.00, 200.00, 12.00, 24.00, false, 'GST', 0.00, 0.00, 3),
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440005', 'discount', 'VIP Discount', 1, -300.00, -300.00, 0.00, 0.00, false, 'GST', 0.00, 300.00, 4)
ON CONFLICT (id) DO NOTHING;

-- Insert sample payments
INSERT INTO invoice_payments (
  id,
  invoice_id,
  payment_date,
  amount,
  payment_method,
  reference_number,
  notes
) VALUES
-- Payments for Invoice 1 (Fully Paid)
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '2025-01-15', 7840.00, 'card', 'TXN123456789', 'Payment via Credit Card'),

-- Payments for Invoice 2 (Partial Payment)
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '2025-01-10', 3000.00, 'cash', NULL, 'Advance payment in cash'),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '2025-01-12', 2000.00, 'upi', 'UPI987654321', 'Partial payment via UPI'),

-- Payments for Invoice 5 (Partial Payment)
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '1 day', 2000.00, 'bank_transfer', 'NEFT123456', 'Bank transfer payment')
ON CONFLICT (id) DO NOTHING;
