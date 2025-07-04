-- Enhanced get_available_rooms function with room type filtering
-- Migration: 017_enhanced_get_available_rooms_function.sql

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_available_rooms(text, text);
DROP FUNCTION IF EXISTS get_available_rooms(date, date, time, time);
DROP FUNCTION IF EXISTS get_available_rooms(text, text, text, text, text);

-- Create the comprehensive function for getting available rooms
CREATE OR REPLACE FUNCTION get_available_rooms(
  p_check_in_date date,
  p_check_out_date date,
  p_check_in_time time DEFAULT '14:00:00',
  p_check_out_time time DEFAULT '11:00:00',
  p_room_type varchar DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  room_number varchar,
  room_type varchar,
  ac_rate numeric,
  non_ac_rate numeric,
  base_rate numeric,
  current_rate numeric,
  amenities text[],
  max_occupancy integer,
  allow_extra_bed boolean,
  has_ac boolean,
  description text,
  images text[],
  floor_number integer,
  is_active boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.ac_rate,
    r.non_ac_rate,
    r.base_rate,
    r.current_rate,
    r.amenities,
    r.max_occupancy,
    r.allow_extra_bed,
    r.has_ac,
    r.description,
    r.images,
    r.floor_number,
    r.is_active
  FROM rooms r
  WHERE r.status = 'available'
    AND r.is_active = true
    -- Optional room type filtering
    AND (p_room_type IS NULL OR r.room_type = p_room_type)
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.booking_status IN ('confirmed', 'checked_in')
        AND NOT (
          -- No overlap: new booking ends before existing starts
          (p_check_out_date < b.check_in_date) OR
          (p_check_out_date = b.check_in_date AND p_check_out_time <= b.check_in_time) OR
          -- No overlap: new booking starts after existing ends
          (p_check_in_date > b.check_out_date) OR
          (p_check_in_date = b.check_out_date AND p_check_in_time >= b.check_out_time)
        )
    )
  ORDER BY r.room_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_rooms(date, date, time, time, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_rooms(date, date, time, time, varchar) TO anon;

-- Test the function without room type filter
SELECT id, room_number, room_type FROM get_available_rooms('2024-12-30'::date, '2024-12-31'::date) LIMIT 5;

-- Test the function with room type filter
SELECT id, room_number, room_type FROM get_available_rooms('2024-12-30'::date, '2024-12-31'::date, '14:00', '12:00', 'double-bed-deluxe') LIMIT 5; 