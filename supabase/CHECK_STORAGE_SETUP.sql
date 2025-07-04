-- =====================================================
-- Storage Setup Verification & Fix Script
-- =====================================================
-- Run this in your Supabase SQL Editor to check and fix storage permissions

-- 1. Check if your bucket exists
SELECT 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE name = 'hotel-pride';

-- 2. Check if RLS is enabled on storage.objects
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Check existing storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 4. Check your user profile and role
SELECT 
  id,
  email,
  full_name,
  role 
FROM profiles 
WHERE id = auth.uid();

-- =====================================================
-- If the above shows missing policies, run this section:
-- =====================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they need to be recreated
DROP POLICY IF EXISTS "Allow authenticated staff to upload customer IDs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated staff to view customer IDs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated staff to delete customer IDs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated staff to update customer IDs" ON storage.objects;

-- Create the storage policies for hotel-pride bucket
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

-- =====================================================
-- Final verification
-- =====================================================

-- Check policies were created
SELECT 
  policyname,
  cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%customer IDs%';

-- Test your role access (should show your role)
SELECT 
  'Current user role: ' || role as message
FROM profiles 
WHERE id = auth.uid(); 