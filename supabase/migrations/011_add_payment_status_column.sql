-- Add payment_status column to payments to align with booking workflow
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending','completed','refunded')); 