-- Fix get_available_rooms function with correct column references
-- Migration: 016_fix_get_available_rooms_function.sql

-- Drop existing function
DROP FUNCTION IF EXISTS get_available_rooms(date, date, time, time);

-- Create the corrected function for getting available rooms
CREATE OR REPLACE FUNCTION get_available_rooms(
  p_check_in_date date,
  p_check_out_date date,
  p_check_in_time time DEFAULT '14:00:00',
  p_check_out_time time DEFAULT '11:00:00'
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
  images text[]
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
    r.images
  FROM rooms r
  WHERE r.status = 'available'
    AND r.is_active = true
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
GRANT EXECUTE ON FUNCTION get_available_rooms(date, date, time, time) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_rooms(date, date, time, time) TO anon;

-- Test the function
SELECT id, room_number, room_type FROM get_available_rooms('2024-12-30'::date, '2024-12-31'::date); 