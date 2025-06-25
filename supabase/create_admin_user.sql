-- =====================================================
-- CREATE ADMIN USER: MIHIR
-- =====================================================
-- This script creates an admin user for Mihir
-- Email: jadhav.mihir05@gmail.com
-- Temporary Password: Hotel@123 (must be changed on first login)

-- NOTE: This script should be run AFTER the user signs up through the application
-- The user must first sign up with email jadhav.mihir05@gmail.com
-- Then run this script to set them as admin

-- Update the user's profile to admin role
UPDATE profiles 
SET 
  role = 'admin',
  full_name = 'Mihir',
  is_active = true,
  updated_at = NOW()
WHERE email = 'jadhav.mihir05@gmail.com';

-- Insert a welcome notification for the admin
INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT 
  id,
  'Welcome to Hotel Management System',
  'Welcome Mihir! You have been granted admin access to the hotel management system. Please change your password on first login for security.',
  'info',
  false
FROM profiles 
WHERE email = 'jadhav.mihir05@gmail.com';

-- Verify the admin user was created
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM profiles 
WHERE email = 'jadhav.mihir05@gmail.com';

-- Show success message
SELECT 'Admin user Mihir created successfully!' as message;
SELECT 'Email: jadhav.mihir05@gmail.com' as email;
SELECT 'Role: admin' as role;
SELECT 'Please ask Mihir to sign up first, then run this script to grant admin access.' as instructions; 