-- =====================================================
-- Migration 002 - Configure Room Types & Seed Rooms (2025-06-25)
-- =====================================================

-- 1. Extend room_type CHECK constraint to include VIP Non-AC
ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_room_type_check;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_room_type_check CHECK (
    room_type IN (
      'ac-2bed',
      'non-ac-2bed',
      'ac-3bed',
      'non-ac-3bed',
      'vip-ac',
      'vip-non-ac'
    )
);

-- 2. Remove any existing sample rooms (optional – keeps idempotency)
DELETE FROM rooms;

-- 3. Insert hotel rooms as per current specification
-- Double-bed rooms (12)
INSERT INTO rooms (room_number, room_type, floor_number, base_rate, current_rate, max_occupancy, amenities, status)
VALUES
  -- Floor-1 Non-AC
  ('101', 'non-ac-2bed', 1, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  ('102', 'non-ac-2bed', 1, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  ('106', 'non-ac-2bed', 1, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  ('107', 'non-ac-2bed', 1, 1800.00, 1800.00, 2, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  -- Floor-2 AC
  ('201', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('202', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('206', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('207', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('208', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('209', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('210', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available'),
  ('211', 'ac-2bed', 2, 2500.00, 2500.00, 2, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water'], 'available');

-- Trio 3-Single-bed rooms (4)
INSERT INTO rooms (room_number, room_type, floor_number, base_rate, current_rate, max_occupancy, amenities, status)
VALUES
  ('103', 'non-ac-3bed', 1, 2800.00, 2800.00, 3, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  ('105', 'ac-3bed',    1, 3500.00, 3500.00, 3, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water','Mini Fridge'], 'available'),
  ('203', 'non-ac-3bed', 2, 2800.00, 2800.00, 3, ARRAY['Ceiling Fan','Television','Wi-Fi','Hot Water'], 'available'),
  ('205', 'ac-3bed',    2, 3500.00, 3500.00, 3, ARRAY['Air Conditioning','Television','Wi-Fi','Hot Water','Mini Fridge'], 'available');

-- VIP Double-bed rooms (2)
INSERT INTO rooms (room_number, room_type, floor_number, base_rate, current_rate, max_occupancy, amenities, status)
VALUES
  ('104', 'vip-non-ac', 1, 4500.00, 4500.00, 4, ARRAY['Ceiling Fan','Smart TV','Wi-Fi','Hot Water','Mini Fridge','Sofa Set'], 'available'),
  ('204', 'vip-ac',     2, 5500.00, 5500.00, 4, ARRAY['Air Conditioning','Smart TV','Wi-Fi','Hot Water','Mini Fridge','Sofa Set','Balcony'], 'available');

-- 4. Seed default pricing into room_rates (one entry per type)
INSERT INTO room_rates (room_type, rate_date, base_rate, weekend_rate, holiday_rate)
VALUES
  ('ac-2bed',     CURRENT_DATE, 2500.00, 2700.00, 3000.00),
  ('non-ac-2bed', CURRENT_DATE, 1800.00, 2000.00, 2300.00),
  ('ac-3bed',     CURRENT_DATE, 3500.00, 3800.00, 4200.00),
  ('non-ac-3bed', CURRENT_DATE, 2800.00, 3000.00, 3400.00),
  ('vip-ac',      CURRENT_DATE, 5500.00, 6000.00, 6500.00),
  ('vip-non-ac',  CURRENT_DATE, 4500.00, 5000.00, 5500.00); 