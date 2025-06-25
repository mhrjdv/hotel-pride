-- =====================================================
-- Hotel Management System - Complete Database Schema
-- =====================================================
-- This file contains the complete database structure for easy recreation
-- Version: 1.0
-- Date: 2024-12-15

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'receptionist')),
  phone VARCHAR(15),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- HOTEL CONFIGURATION TABLE
-- =====================================================
CREATE TABLE hotel_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name VARCHAR(100) NOT NULL DEFAULT 'Hotel Management System',
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pin_code VARCHAR(10),
  phone VARCHAR(15),
  email VARCHAR(100),
  gst_number VARCHAR(15),
  currency VARCHAR(3) DEFAULT 'INR',
  gst_rate DECIMAL(5,4) DEFAULT 0.12, -- 12% GST
  check_in_time TIME DEFAULT '14:00:00',
  check_out_time TIME DEFAULT '12:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number VARCHAR(10) UNIQUE NOT NULL,
  room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('ac-2bed', 'non-ac-2bed', 'ac-3bed', 'non-ac-3bed', 'vip-ac')),
  floor_number INTEGER,
  base_rate DECIMAL(10,2) NOT NULL,
  current_rate DECIMAL(10,2) NOT NULL,
  amenities TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
  max_occupancy INTEGER NOT NULL,
  description TEXT,
  images TEXT[], -- Array of image URLs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15) NOT NULL, -- +91XXXXXXXXXX format
  alternate_phone VARCHAR(15),
  id_type VARCHAR(20) NOT NULL CHECK (id_type IN ('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id')),
  id_number VARCHAR(50) NOT NULL,
  id_photo_url TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pin_code VARCHAR(10),
  country VARCHAR(50) DEFAULT 'India',
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  nationality VARCHAR(50) DEFAULT 'Indian',
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  notes TEXT,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  primary_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMP WITH TIME ZONE,
  actual_check_out TIMESTAMP WITH TIME ZONE,
  total_guests INTEGER NOT NULL DEFAULT 1,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  room_rate DECIMAL(10,2) NOT NULL,
  total_nights INTEGER NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  due_amount DECIMAL(10,2) DEFAULT 0.00,
  is_gst_inclusive BOOLEAN NOT NULL DEFAULT true,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  booking_source VARCHAR(20) DEFAULT 'walk_in' CHECK (booking_source IN ('walk_in', 'phone', 'online', 'agent')),
  special_requests TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_amount CHECK (total_amount = base_amount - discount_amount + gst_amount),
  CONSTRAINT valid_guests CHECK (total_guests = adults + children),
  CONSTRAINT valid_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= total_amount)
);

-- =====================================================
-- BOOKING GUESTS TABLE
-- =====================================================
CREATE TABLE booking_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  relationship VARCHAR(20), -- wife, child, friend, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(booking_id, customer_id)
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reference_number VARCHAR(100),
  transaction_id VARCHAR(100),
  notes TEXT,
  is_refund BOOLEAN DEFAULT false,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL
);

-- =====================================================
-- ROOM MAINTENANCE TABLE
-- =====================================================
CREATE TABLE room_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('cleaning', 'repair', 'upgrade', 'inspection')),
  description TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  assigned_to VARCHAR(100), -- Staff member name
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- ROOM RATES TABLE (Dynamic Pricing)
-- =====================================================
CREATE TABLE room_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type VARCHAR(20) NOT NULL,
  rate_date DATE NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  weekend_rate DECIMAL(10,2),
  holiday_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  
  UNIQUE(room_type, rate_date)
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (has_permission('admin'));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (has_permission('admin'));

-- Hotel config policies (admin only)
CREATE POLICY "Admin can view hotel config" ON hotel_config FOR SELECT USING (has_permission('admin'));
CREATE POLICY "Admin can update hotel config" ON hotel_config FOR UPDATE USING (has_permission('admin'));

-- Rooms policies (all authenticated users can view, staff+ can modify)
CREATE POLICY "Authenticated users can view rooms" ON rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify rooms" ON rooms FOR ALL USING (has_permission('staff'));

-- Customers policies (all authenticated users)
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify customers" ON customers FOR ALL USING (has_permission('staff'));

-- Bookings policies (all authenticated users)
CREATE POLICY "Authenticated users can view bookings" ON bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify bookings" ON bookings FOR ALL USING (has_permission('staff'));

-- Booking guests policies
CREATE POLICY "Authenticated users can view booking guests" ON booking_guests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify booking guests" ON booking_guests FOR ALL USING (has_permission('staff'));

-- Payments policies (all authenticated users)
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify payments" ON payments FOR ALL USING (has_permission('staff'));

-- Room maintenance policies
CREATE POLICY "Authenticated users can view maintenance" ON room_maintenance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can modify maintenance" ON room_maintenance FOR ALL USING (has_permission('staff'));

-- Room rates policies
CREATE POLICY "Authenticated users can view rates" ON room_rates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manager can modify rates" ON room_rates FOR ALL USING (has_permission('manager'));

-- Audit logs policies (admin only)
CREATE POLICY "Admin can view audit logs" ON audit_logs FOR SELECT USING (has_permission('admin'));

-- Notifications policies (users can see their own)
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can create notifications" ON notifications FOR INSERT WITH CHECK (has_permission('admin'));

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_config_updated_at BEFORE UPDATE ON hotel_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_maintenance_updated_at BEFORE UPDATE ON room_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update booking payment status
CREATE OR REPLACE FUNCTION update_booking_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  booking_total DECIMAL(10,2);
  total_paid DECIMAL(10,2);
BEGIN
  -- Get booking total and calculate total paid
  SELECT 
    b.total_amount,
    COALESCE(SUM(CASE WHEN p.is_refund THEN -p.amount ELSE p.amount END), 0)
  INTO booking_total, total_paid
  FROM bookings b
  LEFT JOIN payments p ON b.id = p.booking_id
  WHERE b.id = COALESCE(NEW.booking_id, OLD.booking_id)
  GROUP BY b.total_amount;
  
  -- Update payment status
  UPDATE bookings SET
    paid_amount = total_paid,
    due_amount = booking_total - total_paid,
    payment_status = CASE
      WHEN total_paid >= booking_total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update booking payment status
CREATE TRIGGER update_booking_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_booking_payment_status();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer total bookings and spent amount
  UPDATE customers SET
    total_bookings = (
      SELECT COUNT(*) FROM bookings 
      WHERE primary_customer_id = NEW.primary_customer_id
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
      WHERE primary_customer_id = NEW.primary_customer_id 
      AND booking_status IN ('checked_out', 'checked_in')
    ),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = NEW.primary_customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Function to auto-update room status based on bookings
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update room status when booking status changes
  IF NEW.booking_status = 'checked_in' AND OLD.booking_status != 'checked_in' THEN
    UPDATE rooms SET status = 'occupied' WHERE id = NEW.room_id;
  ELSIF NEW.booking_status = 'checked_out' AND OLD.booking_status = 'checked_in' THEN
    UPDATE rooms SET status = 'cleaning' WHERE id = NEW.room_id;
  ELSIF NEW.booking_status IN ('cancelled', 'no_show') THEN
    UPDATE rooms SET status = 'available' WHERE id = NEW.room_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update room status
CREATE TRIGGER update_room_status_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_room_status();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Booking indexes
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_bookings_check_out_date ON bookings(check_out_date);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_customer_id ON bookings(primary_customer_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- Customer indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);

-- Room indexes
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_number ON rooms(room_number);

-- Payment indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Audit log indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS FOR SAFE OPERATIONS
-- =====================================================

-- Function to get current user profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
  id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  is_active BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role, p.is_active
  FROM profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(required_role TEXT)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN CASE
    WHEN required_role = 'admin' THEN user_role = 'admin'
    WHEN required_role = 'manager' THEN user_role IN ('admin', 'manager')
    WHEN required_role = 'staff' THEN user_role IN ('admin', 'manager', 'staff')
    WHEN required_role = 'receptionist' THEN user_role IN ('admin', 'manager', 'staff', 'receptionist')
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Room availability view
CREATE OR REPLACE VIEW room_availability AS
SELECT 
  r.*,
  CASE 
    WHEN r.status = 'available' THEN true
    ELSE false
  END as is_available,
  b.booking_number as current_booking,
  b.check_out_date as current_checkout,
  c.name as current_guest
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id 
  AND b.booking_status = 'checked_in'
LEFT JOIN customers c ON b.primary_customer_id = c.id;

-- Booking summary view
CREATE OR REPLACE VIEW booking_summary AS
SELECT 
  b.*,
  r.room_number,
  r.room_type,
  c.name as primary_guest_name,
  c.phone as primary_guest_phone,
  COALESCE(p.total_paid, 0) as total_paid,
  (b.total_amount - COALESCE(p.total_paid, 0)) as balance_due
FROM bookings b
JOIN rooms r ON b.room_id = r.id
JOIN customers c ON b.primary_customer_id = c.id
LEFT JOIN (
  SELECT 
    booking_id,
    SUM(CASE WHEN is_refund THEN -amount ELSE amount END) as total_paid
  FROM payments
  GROUP BY booking_id
) p ON b.id = p.booking_id;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default hotel configuration
INSERT INTO hotel_config (
  hotel_name,
  address_line1,
  city,
  state,
  pin_code,
  phone,
  email,
  gst_number
) VALUES (
  'Hotel Management System',
  'Hotel Address Line 1',
  'Your City',
  'Your State',
  '000000',
  '+91-0000000000',
  'hotel@example.com',
  'GST_NUMBER_HERE'
);

-- Insert 18 rooms with various types and configurations
INSERT INTO rooms (room_number, room_type, floor_number, base_rate, current_rate, max_occupancy, amenities, status) VALUES
-- AC 2-Bed Rooms (6 rooms)
('A201', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('A202', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('A203', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'occupied'),
('A204', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('A205', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'occupied'),
('A206', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),

-- Non-AC 2-Bed Rooms (4 rooms)
('N201', 'non-ac-2bed', 2, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('N202', 'non-ac-2bed', 2, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'occupied'),
('N203', 'non-ac-2bed', 2, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('N204', 'non-ac-2bed', 2, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'cleaning'),

-- AC 3-Bed Rooms (4 rooms) 
('A301', 'ac-3bed', 3, 3500.00, 3500.00, 3, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water', 'Mini Fridge'], 'available'),
('A302', 'ac-3bed', 3, 3500.00, 3500.00, 3, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water', 'Mini Fridge'], 'occupied'),
('A303', 'ac-3bed', 3, 3500.00, 3500.00, 3, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water', 'Mini Fridge'], 'occupied'),
('A304', 'ac-3bed', 3, 3500.00, 3500.00, 3, ARRAY['Air Conditioning', 'Television', 'Wi-Fi', 'Hot Water', 'Mini Fridge'], 'available'),

-- Non-AC 3-Bed Rooms (2 rooms)
('N301', 'non-ac-3bed', 3, 2800.00, 2800.00, 3, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'available'),
('N302', 'non-ac-3bed', 3, 2800.00, 2800.00, 3, ARRAY['Ceiling Fan', 'Television', 'Wi-Fi', 'Hot Water'], 'occupied'),

-- VIP AC Suites (2 rooms)
('V401', 'vip-ac', 4, 5500.00, 5500.00, 4, ARRAY['Air Conditioning', 'Smart TV', 'Wi-Fi', 'Hot Water', 'Mini Fridge', 'Sofa Set', 'Balcony'], 'available'),
('V402', 'vip-ac', 4, 5500.00, 5500.00, 4, ARRAY['Air Conditioning', 'Smart TV', 'Wi-Fi', 'Hot Water', 'Mini Fridge', 'Sofa Set', 'Balcony'], 'occupied');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Database schema setup completed successfully!
-- This includes:
-- - Complete table structure with relationships
-- - Row Level Security (RLS) policies
-- - Triggers for automation
-- - Indexes for performance
-- - Views for common queries
-- - Security definer functions
-- - Sample room data (18 rooms)
-- ===================================================== 