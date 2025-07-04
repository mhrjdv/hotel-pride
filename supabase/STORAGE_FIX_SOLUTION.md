# 🔧 Storage Upload Fix - Dashboard Solution

## ✅ Problem Identified
Your storage upload is failing because the existing storage policies are too generic. You have the bucket and files, but need proper bucket-specific policies.

## 🚀 Solution (Using Supabase Dashboard)

### Step 1: Access Storage Policies
1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. You'll see existing policies for `storage.objects`

### Step 2: Delete Generic Policies
Delete these overly broad policies:
- "Allow admin read access"  
- "Allow authenticated insert"
- "Allow user and admin delete access"
- "Allow user and admin update access"

### Step 3: Create Hotel-Specific Policies

**Policy 1: Allow Upload to Hotel-Pride**
```
Policy Name: Allow hotel staff to upload to hotel-pride
Table: storage.objects
Operation: INSERT
Target roles: authenticated

Policy Definition:
```sql
(bucket_id = 'hotel-pride'::text) AND 
((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin'))
```

**Policy 2: Allow Read from Hotel-Pride**  
```
Policy Name: Allow hotel staff to read from hotel-pride
Table: storage.objects  
Operation: SELECT
Target roles: authenticated

Policy Definition:
```sql
(bucket_id = 'hotel-pride'::text) AND 
((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin'))
```

**Policy 3: Allow Update in Hotel-Pride**
```
Policy Name: Allow hotel staff to update in hotel-pride
Table: storage.objects
Operation: UPDATE  
Target roles: authenticated

Policy Definition:
```sql
(bucket_id = 'hotel-pride'::text) AND 
((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin'))
```

**Policy 4: Allow Delete from Hotel-Pride**
```
Policy Name: Allow hotel staff to delete from hotel-pride
Table: storage.objects
Operation: DELETE
Target roles: authenticated

Policy Definition:
```sql
(bucket_id = 'hotel-pride'::text) AND 
((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin'))
```

### Step 4: Test Upload
After creating these policies, try uploading a customer photo again.

## 🔄 Alternative: Quick SQL Fix (If Dashboard Doesn't Work)

If you have **superuser access**, run this in SQL Editor:

```sql
-- Drop existing generic policies
DROP POLICY IF EXISTS "Allow admin read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;  
DROP POLICY IF EXISTS "Allow user and admin delete access" ON storage.objects;
DROP POLICY IF EXISTS "Allow user and admin update access" ON storage.objects;

-- Create hotel-specific policies
CREATE POLICY "Allow hotel staff to upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-pride' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin')
  );

CREATE POLICY "Allow hotel staff to read" ON storage.objects  
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'hotel-pride' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin')
  );

CREATE POLICY "Allow hotel staff to update" ON storage.objects
  FOR UPDATE TO authenticated  
  USING (
    bucket_id = 'hotel-pride' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin')
  );

CREATE POLICY "Allow hotel staff to delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'hotel-pride' AND  
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'manager', 'admin')
  );
```

## ✅ Expected Result
After applying these policies, photo uploads in customer edit forms should work properly for users with `staff`, `manager`, or `admin` roles.

## 🔍 Troubleshooting  
If still having issues:
1. Check user is logged in: `SELECT auth.uid()`
2. Check user role: `SELECT role FROM profiles WHERE id = auth.uid()`  
3. Verify bucket access in browser console
4. Check Supabase logs for detailed error messages 