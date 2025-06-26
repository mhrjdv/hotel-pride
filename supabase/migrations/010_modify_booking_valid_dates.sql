-- Allow same-day check-in / check-out (>= instead of >)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_dates;
ALTER TABLE bookings ADD CONSTRAINT valid_dates CHECK (check_out_date >= check_in_date); 