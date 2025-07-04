# 🏨 Hotel Management System - Supabase Database Setup

Quick setup guide for configuring your Supabase database with admin authentication.

## 📋 Prerequisites

- Supabase account at [supabase.com](https://supabase.com)
- New Supabase project created
- Project URL and anon key ready

## 🚀 Database Setup (5 minutes)

### Step 1: Apply Database Schema

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire content from `supabase/migrations/001_initial_setup.sql`
3. Paste and click **Run**

**✅ This creates:**
- 11 tables (rooms, customers, bookings, payments, etc.)
- Row Level Security policies
- Automated triggers
- 18 sample rooms with different types
- Performance indexes

### Step 2: Environment Configuration

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 3: Setup Storage Bucket

**For customer ID photo uploads:**

1. **Create storage bucket:**
   - Go to **Storage** section in Supabase Dashboard
   - Click **New bucket**
   - Name: `hotel-pride`
   - Set **Public access**: OFF (Private bucket)
   - Click **Create bucket**

2. **Apply storage policies:**
   - Back to **SQL Editor**
   - Copy content from `supabase/migrations/005_storage_rls_policies.sql`
   - Paste and run (this sets up secure access for hotel staff)

### Step 4: Create Admin User

1. **Sign up first:**
   ```bash
   npm run dev
   ```
   - Go to `/login`
   - Sign up with: `jadhav.mihir05@gmail.com`
   - Use any password (change later)

2. **Grant admin access:**
   - Back to **Supabase SQL Editor**
   - Copy content from `supabase/create_admin_user.sql`
   - Paste and run

## ✅ Verification

**Check setup success:**
```sql
-- Verify tables created
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check sample data
SELECT count(*) as rooms FROM rooms;
SELECT room_number, room_type, status FROM rooms ORDER BY room_number;

-- Verify admin user
SELECT email, full_name, role FROM profiles WHERE email = 'jadhav.mihir05@gmail.com';

-- Check storage bucket exists
SELECT name FROM storage.buckets WHERE name = 'hotel-pride';

-- Verify storage policies
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

**Expected results:**
- 11 tables created
- 18 rooms inserted
- Admin user with role 'admin'
- Storage bucket 'hotel-pride' exists
- Storage RLS policies applied

## 🔑 Admin Access

**Login credentials:**
- **Email:** `jadhav.mihir05@gmail.com`
- **Password:** What you set during signup
- **Role:** Admin (full system access)

## 📊 Sample Data Included

- **18 Rooms:** AC/Non-AC, 2-bed/3-bed/VIP configurations
- **Room Types:** A201-A206 (AC 2-bed), N201-N204 (Non-AC 2-bed), A301-A304 (AC 3-bed), N301-N302 (Non-AC 3-bed), V401-V402 (VIP AC)
- **Status Examples:** Available, Occupied, Cleaning
- **Rates:** ₹1,800 - ₹5,500 per night

## 🛠️ Troubleshooting

**Common issues:**

1. **RLS Policy Errors**
   ```sql
   -- Check user role
   SELECT role FROM profiles WHERE id = auth.uid();
   ```

2. **Missing Tables**
   - Re-run the migration file
   - Check for SQL errors in Supabase logs

3. **Admin Access Denied**
   - Ensure user signed up first
   - Run create_admin_user.sql after signup

## 🔄 Schema Updates

When modifying database structure:

1. Update `supabase/migrations/001_initial_setup.sql`
2. Update TypeScript types in `src/lib/supabase/types.ts`
3. Test locally before production

---

**Setup Complete! 🎉** 

Your hotel management system is ready with:
- ✅ Complete database schema
- ✅ Security policies (RLS)
- ✅ Storage bucket for customer ID photos
- ✅ 18 sample rooms
- ✅ Admin user configured
- ✅ Production-ready structure 