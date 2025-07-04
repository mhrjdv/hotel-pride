-- =====================================================
-- Migration 015 - Fix Room Types and Data Consistency
-- =====================================================

-- First, update the room_type constraint to match the expected values
ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_room_type_check;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_room_type_check CHECK (
    room_type IN ('double-bed-deluxe', 'vip', 'executive-3bed')
  );

-- Update existing rooms to use the new room types
-- Map from old types to new types
UPDATE rooms SET 
  room_type = 'double-bed-deluxe',
  has_ac = false,
  ac_rate = 2500.00,
  non_ac_rate = 1800.00,
  allow_extra_bed = true
WHERE room_type IN ('ac-2bed', 'non-ac-2bed');

UPDATE rooms SET 
  room_type = 'executive-3bed',
  has_ac = false,
  ac_rate = 3500.00,
  non_ac_rate = 2800.00,
  allow_extra_bed = true
WHERE room_type IN ('ac-3bed', 'non-ac-3bed');

UPDATE rooms SET 
  room_type = 'vip',
  has_ac = false,
  ac_rate = 5500.00,
  non_ac_rate = 4500.00,
  allow_extra_bed = true
WHERE room_type IN ('vip-ac', 'vip-non-ac');

-- Update the current_rate based on the room type
UPDATE rooms SET 
  current_rate = CASE 
    WHEN room_type = 'double-bed-deluxe' THEN 1800.00
    WHEN room_type = 'executive-3bed' THEN 2800.00
    WHEN room_type = 'vip' THEN 4500.00
    ELSE current_rate
  END;

-- Update room_rates table to match new types
DELETE FROM room_rates;
INSERT INTO room_rates (room_type, rate_date, base_rate, weekend_rate, holiday_rate)
VALUES
  ('double-bed-deluxe', CURRENT_DATE, 1800.00, 2000.00, 2300.00),
  ('executive-3bed', CURRENT_DATE, 2800.00, 3000.00, 3400.00),
  ('vip', CURRENT_DATE, 4500.00, 5000.00, 5500.00);

-- Update the get_room_rate function to handle new types
CREATE OR REPLACE FUNCTION get_room_rate(room_id UUID, with_ac BOOLEAN DEFAULT false)
RETURNS DECIMAL(10,2)
LANGUAGE sql
AS $$
  SELECT CASE 
    WHEN with_ac THEN COALESCE(ac_rate, current_rate + 700)
    ELSE COALESCE(non_ac_rate, current_rate)
  END
  FROM rooms 
  WHERE id = room_id;
$$;

-- Add some helpful constraints
ALTER TABLE rooms ADD CONSTRAINT rooms_ac_rate_positive CHECK (ac_rate IS NULL OR ac_rate > 0);
ALTER TABLE rooms ADD CONSTRAINT rooms_non_ac_rate_positive CHECK (non_ac_rate IS NULL OR non_ac_rate > 0);
ALTER TABLE rooms ADD CONSTRAINT rooms_max_occupancy_positive CHECK (max_occupancy > 0);

-- Ensure all rooms have proper occupancy settings
UPDATE rooms SET max_occupancy = 2 WHERE room_type = 'double-bed-deluxe' AND max_occupancy != 2;
UPDATE rooms SET max_occupancy = 3 WHERE room_type = 'executive-3bed' AND max_occupancy != 3;
UPDATE rooms SET max_occupancy = 4 WHERE room_type = 'vip' AND max_occupancy != 4; 