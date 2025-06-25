# Hotel Management System

A comprehensive hotel management system designed for Indian hotels with 18 rooms, featuring check-in/check-out, GST billing, customer management, and admin controls.

## 🏨 Features

### Core Functionality
- **Room Management**: 18 rooms with AC/Non-AC, 2-bed/3-bed/VIP configurations
- **Real-time Room Status**: Available, Occupied, Cleaning, Maintenance, Blocked
- **Indian GST Compliance**: 12% hotel tax with inclusive/exclusive billing options
- **Customer Management**: ID verification with Aadhaar, PAN, Passport support
- **Booking System**: Complete reservation management with payment processing
- **Multi-device Support**: Responsive design for phones, tablets, and desktops

### Indian Market Specific
- **GST Calculations**: Automatic tax calculations with proper invoicing
- **ID Types**: Aadhaar, PAN, Passport, Driving License, Voter ID support
- **Phone Validation**: +91 Indian mobile number format
- **Address Format**: Complete Indian address with State, District, PIN
- **Currency**: INR formatting with proper Indian number formatting

## 🛠️ Tech Stack

- **Framework**: Next.js 15 + App Router + TypeScript
- **UI**: Shadcn/ui + Tailwind CSS 4
- **Backend**: Supabase (Database, Auth, Storage, Real-time)
- **Email**: Gmail SMTP for receipts
- **Validation**: Zod schemas
- **Forms**: React Hook Form

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hotel-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

   # Gmail SMTP Configuration (for sending receipts)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_app_password

   # Application Configuration
   NEXT_PUBLIC_APP_NAME="Hotel Management System"
   NEXT_PUBLIC_HOTEL_NAME="Your Hotel Name"
   NEXT_PUBLIC_HOTEL_ADDRESS="Your Hotel Address"
   NEXT_PUBLIC_HOTEL_PHONE="+91-XXXXXXXXXX"
   NEXT_PUBLIC_HOTEL_EMAIL="hotel@example.com"
   NEXT_PUBLIC_GST_NUMBER="YOUR_GST_NUMBER"

   # Security
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   Run the following SQL in your Supabase SQL editor to create the required tables:

   ```sql
   -- Enable necessary extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create rooms table (18 rooms for Indian hotel)
   CREATE TABLE rooms (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     room_number VARCHAR(10) UNIQUE NOT NULL,
     room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('ac-2bed', 'non-ac-2bed', 'ac-3bed', 'non-ac-3bed', 'vip-ac')),
     base_rate DECIMAL(10,2) NOT NULL,
     current_rate DECIMAL(10,2) NOT NULL,
     amenities TEXT[],
     status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
     max_occupancy INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- Create customers table (Indian context)
   CREATE TABLE customers (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name VARCHAR(100) NOT NULL,
     email VARCHAR(100),
     phone VARCHAR(15) NOT NULL, -- +91XXXXXXXXXX format
     id_type VARCHAR(20) NOT NULL CHECK (id_type IN ('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id')),
     id_number VARCHAR(50) NOT NULL,
     id_photo_url TEXT,
     address_line1 TEXT,
     address_line2 TEXT,
     city VARCHAR(50),
     state VARCHAR(50),
     pin_code VARCHAR(10),
     country VARCHAR(50) DEFAULT 'India',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- Create bookings table
   CREATE TABLE bookings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     booking_number VARCHAR(20) UNIQUE NOT NULL,
     room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
     primary_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
     check_in_date DATE NOT NULL,
     check_out_date DATE NOT NULL,
     actual_check_in TIMESTAMP WITH TIME ZONE,
     actual_check_out TIMESTAMP WITH TIME ZONE,
     total_guests INTEGER NOT NULL DEFAULT 1,
     room_rate DECIMAL(10,2) NOT NULL,
     total_nights INTEGER NOT NULL,
     base_amount DECIMAL(10,2) NOT NULL,
     gst_amount DECIMAL(10,2) NOT NULL,
     total_amount DECIMAL(10,2) NOT NULL,
     is_gst_inclusive BOOLEAN NOT NULL DEFAULT true,
     payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
     booking_status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
     special_requests TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     created_by UUID, -- Staff user who created the booking
     
     CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
     CONSTRAINT valid_amount CHECK (total_amount = base_amount + gst_amount)
   );

   -- Create booking_guests table (additional guests beyond primary)
   CREATE TABLE booking_guests (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
     customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
     is_primary BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- Create payments table
   CREATE TABLE payments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
     payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')),
     amount DECIMAL(10,2) NOT NULL,
     payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     reference_number VARCHAR(100),
     notes TEXT,
     created_by UUID, -- Staff user who recorded the payment
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Hotel Workflow
1. **Room Selection** → **Guest Registration** → **Payment Processing** → **Check-in Complete**
2. **Booking Process**: Visual room grid → Guest details + ID photos → Payment with GST → Receipt generation
3. **Staff Interface**: Bottom tab nav (mobile), sidebar (desktop), quick actions, emergency buttons

### Key Features
- **Real-time Room Status**: Live updates with color-coded cards
- **GST Billing**: Automatic tax calculations with inclusive/exclusive options
- **ID Verification**: Photo capture with Supabase storage
- **Multi-device**: Responsive design for phones, tablets, desktops
- **Print Integration**: Receipt printing for tablets/desktops

## 🔧 Configuration

### Room Types
- **AC 2-Bed**: Air-conditioned room with 2 beds
- **Non-AC 2-Bed**: Non air-conditioned room with 2 beds  
- **AC 3-Bed**: Air-conditioned room with 3 beds
- **Non-AC 3-Bed**: Non air-conditioned room with 3 beds
- **VIP AC**: Premium air-conditioned suite

### GST Configuration
The system uses 12% GST as per Indian hotel taxation:
- **Inclusive GST**: Tax included in room rate
- **Exclusive GST**: Tax added to room rate

### Payment Methods
- Cash
- Card (Credit/Debit)
- UPI
- Bank Transfer

## 🏗️ Architecture

### Database Schema
- **rooms**: Room inventory and pricing
- **customers**: Guest information and ID verification
- **bookings**: Reservation management
- **booking_guests**: Multiple guests per booking
- **payments**: Payment tracking and history

### Security Features
- Input validation with Zod schemas
- SQL injection prevention
- File upload security
- Authentication and authorization
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

Built with ❤️ for Indian hospitality industry
