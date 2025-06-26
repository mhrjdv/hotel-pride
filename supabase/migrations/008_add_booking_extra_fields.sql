-- Add extra optional fields required by the new booking flow
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS extra_bed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_bed_rate DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS extra_bed_total DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS additional_charges JSONB,
ADD COLUMN IF NOT EXISTS custom_rate_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gst_mode VARCHAR(12) DEFAULT 'inclusive' CHECK (gst_mode IN ('inclusive','exclusive','none')); 