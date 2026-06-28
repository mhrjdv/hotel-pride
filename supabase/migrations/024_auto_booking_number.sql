-- 024: Auto-generate bookings.booking_number on insert.
-- booking_number is NOT NULL UNIQUE with no default; the app/mock used to set it,
-- but real inserts can omit it, causing 23502 not-null violations. This trigger
-- generates a unique number (HTL<YYMM><seq>) whenever one isn't supplied.

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'HTL'
      || to_char(timezone('utc', now()), 'YYMM')
      || lpad(nextval('booking_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_number_trigger ON bookings;
CREATE TRIGGER set_booking_number_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();
