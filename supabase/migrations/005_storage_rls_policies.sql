-- =================================================================
-- IMPORTANT: MANUAL MIGRATION REQUIRED
-- =================================================================
-- REASON: The policies in this file modify the 'storage.objects' table,
-- which requires ownership permissions that the default 'postgres'
-- role used for local migrations does not have.
--
-- INSTRUCTIONS: To apply these security rules, you must run this
-- SQL code manually in the Supabase SQL Editor in your dashboard.
--
-- 1. Navigate to your project in the Supabase Dashboard.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN".
--
-- DO NOT run this file with 'supabase db push' or 'supabase migration up'.
-- =================================================================

-- =====================================================
-- RLS Policies for Customer ID Storage Bucket
-- =====================================================

-- This migration assumes a bucket named 'hotel-pride' has been created.
-- It's recommended to create this bucket in the Supabase Dashboard and set it to NOT be public.

-- 1. Enable RLS on the storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow staff/managers/admins to upload customer ID photos
CREATE POLICY "Allow authenticated staff to upload customer IDs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hotel-pride' AND
  auth.role() = 'authenticated' AND
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('staff', 'manager', 'admin')
);

-- 3. Policy: Allow staff/managers/admins to view all customer ID photos
CREATE POLICY "Allow authenticated staff to view customer IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'hotel-pride' AND
  auth.role() = 'authenticated' AND
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('staff', 'manager', 'admin')
);

-- 4. Policy: Allow staff/managers/admins to delete customer ID photos
CREATE POLICY "Allow authenticated staff to delete customer IDs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hotel-pride' AND
  auth.role() = 'authenticated' AND
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('staff', 'manager', 'admin')
);

-- 5. Policy: Allow staff/managers/admins to update customer ID photos
CREATE POLICY "Allow authenticated staff to update customer IDs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hotel-pride' AND
  auth.role() = 'authenticated' AND
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('staff', 'manager', 'admin')
); 