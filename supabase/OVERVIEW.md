# 📁 Supabase Folder Organization

This folder contains all database-related files for the Hotel Management System, organized for clarity and ease of use.

## 📂 File Structure

```
supabase/
├── migrations/
│   └── 001_initial_setup.sql     # ⭐ Main database schema (complete)
├── SETUP_INSTRUCTIONS.md         # 📋 Quick setup guide
├── create_admin_user.sql         # 👤 Admin user setup
├── sample-data.sql               # 📊 Additional sample data (optional)
└── OVERVIEW.md                   # 📖 This file
```

## 🎯 Key Files

### 1. **migrations/001_initial_setup.sql** (PRIMARY FILE)
- **Complete database schema** with all tables
- **Row Level Security policies** for all tables
- **Automated triggers** and functions
- **18 sample rooms** with different configurations
- **Performance indexes** and views
- **✅ Single source of truth** for database structure

### 2. **SETUP_INSTRUCTIONS.md**
- **5-minute setup guide** for Supabase
- **Admin user creation** steps
- **Verification** commands
- **Troubleshooting** help

### 3. **create_admin_user.sql**
- Sets up admin user: `jadhav.mihir05@gmail.com`
- Run **after** user signs up through the app
- Grants full admin permissions

### 4. **sample-data.sql** (Optional)
- Additional customers and bookings data
- Use for testing and development
- Not required for basic setup

## 🔧 Setup Process

1. **Run** `migrations/001_initial_setup.sql` in Supabase SQL Editor
2. **Configure** environment variables
3. **Sign up** admin user in the app
4. **Run** `create_admin_user.sql` to grant admin access

## ✅ What's Included

- **11 Database Tables:** profiles, rooms, customers, bookings, payments, etc.
- **18 Sample Rooms:** AC/Non-AC, 2-bed/3-bed/VIP configurations
- **Security Policies:** Role-based access control
- **Indian Features:** GST, ID types, phone validation
- **Automated Triggers:** Payment status, room status, audit logs

## 🚀 Benefits

- **No Duplicates:** Single comprehensive migration file
- **Production Ready:** Security, validation, error handling
- **Easy Setup:** One script creates everything
- **Maintainable:** Clear organization, good documentation
- **Extensible:** Easy to add new features

---

**All database setup is now centralized and streamlined! 🎉** 