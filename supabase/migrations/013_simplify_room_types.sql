-- Add AC/Non-AC selection fields to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS has_ac BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ac_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS non_ac_rate DECIMAL(10,2);

-- Update existing rooms to populate the new fields based on room_type
UPDATE rooms SET 
  has_ac = CASE WHEN room_type LIKE 'ac-%' OR room_type = 'vip-ac' THEN true ELSE false END,
  ac_rate = CASE 
    WHEN room_type = 'ac-2bed' THEN 2500.00
    WHEN room_type = 'ac-3bed' THEN 3500.00  
    WHEN room_type = 'vip-ac' THEN 5500.00
    WHEN room_type = 'non-ac-2bed' THEN 2500.00 -- AC upgrade price
    WHEN room_type = 'non-ac-3bed' THEN 3500.00 -- AC upgrade price
    WHEN room_type = 'vip-non-ac' THEN 5500.00 -- AC upgrade price
    ELSE current_rate + 700 -- Default AC surcharge
  END,
  non_ac_rate = CASE 
    WHEN room_type = 'non-ac-2bed' THEN 1800.00
    WHEN room_type = 'non-ac-3bed' THEN 2800.00
    WHEN room_type = 'vip-non-ac' THEN 4500.00
    WHEN room_type = 'ac-2bed' THEN 1800.00 -- Non-AC discount price
    WHEN room_type = 'ac-3bed' THEN 2800.00 -- Non-AC discount price
    WHEN room_type = 'vip-ac' THEN 4500.00 -- Non-AC discount price
    ELSE current_rate - 700 -- Default non-AC discount
  END;

-- Add a function to get room rate based on AC preference
CREATE OR REPLACE FUNCTION get_room_rate(room_id UUID, with_ac BOOLEAN DEFAULT true)
RETURNS DECIMAL(10,2)
LANGUAGE sql
AS $$
  SELECT CASE 
    WHEN with_ac THEN COALESCE(ac_rate, current_rate)
    ELSE COALESCE(non_ac_rate, current_rate - 700)
  END
  FROM rooms 
  WHERE id = room_id;
$$;

-- Add booking AC preference field
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS ac_preference BOOLEAN DEFAULT true;

-- Update existing bookings to set AC preference based on room type
UPDATE bookings SET 
  ac_preference = CASE 
    WHEN EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = bookings.room_id 
      AND (r.room_type LIKE 'ac-%' OR r.room_type = 'vip-ac')
    ) THEN true 
    ELSE false 
  END; 