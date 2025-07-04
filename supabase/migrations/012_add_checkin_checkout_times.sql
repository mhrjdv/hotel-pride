-- Add check-in and check-out time fields for same-day bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '14:00:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '12:00:00';

-- Update constraint to allow same-day bookings with time consideration
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_dates;
ALTER TABLE bookings ADD CONSTRAINT valid_dates CHECK (
  check_out_date > check_in_date OR 
  (check_out_date = check_in_date AND check_out_time > check_in_time)
);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_check_times ON bookings(check_in_date, check_in_time, check_out_date, check_out_time);

-- Update the get_available_rooms function to consider times for same-day bookings
CREATE OR REPLACE FUNCTION get_available_rooms(
    start_date text,
    end_date text,
    start_time text DEFAULT '14:00:00',
    end_time text DEFAULT '12:00:00'
)
RETURNS SETOF rooms
LANGUAGE sql
AS $$
    SELECT r.*
    FROM rooms r
    WHERE
        r.status <> 'blocked'
        AND NOT EXISTS (
            SELECT 1
            FROM bookings b
            WHERE
                b.room_id = r.id
                AND b.booking_status NOT IN ('cancelled', 'no_show')
                AND (
                    -- Different date ranges that overlap
                    (start_date::date, end_date::date) OVERLAPS (b.check_in_date, b.check_out_date)
                    -- Same day bookings with time overlap
                    OR (
                        start_date::date = end_date::date 
                        AND b.check_in_date = b.check_out_date
                        AND start_date::date = b.check_in_date
                        AND (start_time::time, end_time::time) OVERLAPS (b.check_in_time, b.check_out_time)
                    )
                )
        );
$$; 