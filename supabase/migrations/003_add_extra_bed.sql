-- =====================================================
-- Migration 003 - Extra Bed Feature (2025-06-25)
-- =====================================================

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS allow_extra_bed BOOLEAN DEFAULT true;

-- Optionally update existing rows (if new column was added without default)
UPDATE rooms SET allow_extra_bed = true WHERE allow_extra_bed IS NULL; 