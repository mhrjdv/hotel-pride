# Hotel Pride — Hotel Management System

A full-featured hotel-management web app built for a small-city front desk team. Designed for speed, clarity, and low training cost.

**Live:** <https://hotel-pride-cdq09a5b6-yadnesh-0s-projects.vercel.app>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack dev) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Radix UI primitives |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + SSR middleware |
| Email | Nodemailer (SMTP / Ethereal fallback) |
| PDF | Puppeteer (server-side HTML → PDF) |
| Icons | HugeIcons + Lucide-style custom icons |
| Hosting | Vercel |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Project Structure

```
hotel-pride/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Protected dashboard pages
│   │   │   ├── page.tsx          # Dashboard home (stats, room grid)
│   │   │   ├── DashboardClient.tsx
│   │   │   ├── layout.tsx        # SideNav + Header shell
│   │   │   ├── bookings/         # Booking list + detail
│   │   │   ├── customers/        # Customer list + detail
│   │   │   ├── invoices/         # Invoice CRUD + preview + PDF
│   │   │   ├── rooms/            # Room grid with live status
│   │   │   ├── reports/          # Analytics & GST reports
│   │   │   ├── settings/         # Hotel config & bank details
│   │   │   └── admin/            # Admin / user management
│   │   ├── api/
│   │   │   ├── customers/        # GET/POST customers, [id]/invoices
│   │   │   ├── hotel/config/     # GET/PUT hotel configuration
│   │   │   ├── invoice/item-types/ # Custom invoice item types
│   │   │   └── invoices/         # Full invoice REST API
│   │   │       ├── route.ts      # GET (list) / POST (create)
│   │   │       ├── [id]/route.ts # GET / PUT / DELETE single
│   │   │       ├── [id]/email/   # POST send invoice email
│   │   │       ├── [id]/payments/ # POST record payment
│   │   │       ├── [id]/pdf/     # GET download PDF
│   │   │       └── preview/pdf/  # POST preview PDF
│   │   ├── login/                # Login page (Supabase Auth UI)
│   │   ├── layout.tsx            # Root layout (fonts, auth, toaster)
│   │   └── globals.css           # Tailwind + custom styles
│   ├── components/
│   │   ├── auth/                 # AuthProvider
│   │   ├── bookings/             # BookingsClient
│   │   ├── customers/            # Customer components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── icons.tsx             # Centralised icon re-exports
│   │   ├── layout/               # SideNav, Header, SidebarContext
│   │   ├── rooms/                # RoomGrid
│   │   └── ui/                   # Radix-based design system
│   │       ├── alert, avatar, badge, button, card
│   │       ├── dialog, dropdown-menu, error-boundary
│   │       ├── form, input, label, select, separator
│   │       ├── sheet, sonner, switch, table, tabs
│   │       ├── textarea, tooltip
│   │       └── (20 components total)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client (cookies)
│   │   │   ├── admin.ts          # Service-role client
│   │   │   └── types.ts          # Auto-generated DB types (1255 lines)
│   │   ├── types/
│   │   │   ├── invoice.ts        # Invoice, LineItem, Payment types
│   │   │   └── booking.ts        # Room, Customer, Booking types
│   │   ├── utils/
│   │   │   ├── gst.ts            # GST calculation (inclusive/exclusive/none)
│   │   │   ├── gst.test.ts       # GST unit tests
│   │   │   ├── invoice-calculations.ts  # Line item & invoice total calc
│   │   │   ├── invoice-calculations.test.ts
│   │   │   ├── pdf-generator.ts  # Invoice HTML → PDF (Puppeteer)
│   │   │   ├── email-service.ts  # SMTP email with Ethereal fallback
│   │   │   ├── export-csv.ts     # CSV export (RFC 4180, BOM)
│   │   │   ├── hotel.ts          # Hotel config helpers
│   │   │   ├── logger.ts         # Structured logging
│   │   │   ├── performance.ts    # Performance monitoring
│   │   │   ├── validation.ts     # Server-side validation
│   │   │   └── validation.test.ts
│   │   ├── validations/
│   │   │   ├── schemas.ts        # Zod schemas (customer, booking, room)
│   │   │   └── schemas.test.ts
│   │   └── utils.ts              # cn() helper (clsx + tailwind-merge)
│   └── middleware.ts             # Auth guard + role-based access
├── supabase/
│   ├── config.toml
│   ├── migrations/               # 23 sequential SQL migrations
│   │   ├── 001_initial_setup.sql
│   │   ├── ...
│   │   └── 024_auto_booking_number.sql
│   └── *.sql / *.md              # Admin scripts & setup guides
├── e2e/                          # Playwright E2E tests (14 files)
│   ├── auth.spec.ts
│   ├── bookings.spec.ts
│   ├── customers.spec.ts
│   ├── dashboard.spec.ts
│   ├── invoices.spec.ts
│   ├── rooms.spec.ts
│   ├── settings.spec.ts
│   ├── reports.spec.ts
│   ├── gst-report.spec.ts
│   └── a11y.spec.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── AGENTS.md                     # AI agent rules
```

---

## Database Schema (Supabase / PostgreSQL)

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Staff users | `role` (admin / manager / staff / receptionist), `is_active` |
| `hotel_config` | Single-row hotel settings | name, address, GST, bank details, buffet prices |
| `rooms` | 18 rooms | `room_type` (double-bed-deluxe / vip / executive-3bed), `status`, AC/non-AC rates |
| `customers` | Guest records | Indian ID (Aadhaar/PAN/passport/DL/voter), phone, address, blacklist |
| `bookings` | Reservations | room_id, customer_id, dates, GST mode, extra beds, charges, payment status |
| `invoices` | Tax invoices | customer, booking (optional), hotel details, payment tracking |
| `invoice_line_items` | Invoice rows | item_type (room/food/service/extra/discount/other/custom), GST per item |
| `invoice_payments` | Payment records | method (cash/card/upi/bank_transfer/other), amount, reference |
| `invoice_item_types` | Custom item types | name, icon, default GST rate |

### Room Types

| Type | Rooms | Max Occupancy | Extra Bed |
|------|-------|---------------|-----------|
| Double Bed Deluxe | 101–112 | 3 | Yes |
| VIP | 201–204 | 4 | Yes |
| Executive 3-Bed | 301–302 | 6 | Yes |

### Booking Statuses
`confirmed` → `checked_in` → `checked_out` | `cancelled` | `no_show`

### Payment Statuses
`pending` → `partial` → `paid` | `refunded`

---

## Features

### 1. Dashboard (`/`)
- Real-time stats: occupied rooms, today's check-ins/outs, revenue, pending payments
- Room grid with colour-coded status (available / occupied / cleaning / maintenance / blocked)
- Occupancy rate calculation

### 2. Bookings (`/bookings`)
- Full CRUD with multi-step booking flow
- AC preference toggle, custom room rates
- Extra bed support with per-bed pricing
- GST modes: inclusive / exclusive / none
- Additional charges with descriptions
- Payment recording (cash / card / UPI / bank transfer)
- Booking sources: walk-in, phone, online, agent
- Filters by status, date range, room, customer

### 3. Customers (`/customers`)
- Indian ID types: Aadhaar, PAN, Passport, Driving License, Voter ID
- ID photo upload (S3/Supabase storage)
- Address with Indian PIN code validation
- Blacklist management with reasons
- Booking history and total spend tracking
- Phone validation (+91 format)

### 4. Rooms (`/rooms`)
- Real-time status grid
- Rate management (AC / Non-AC / custom)
- Status transitions: available ↔ occupied ↔ cleaning ↔ maintenance ↔ blocked
- Amenities list

### 5. Invoices (`/invoices`)
- **Full tax invoice system** compliant with Indian GST
- Line items with types: room, food, service, extra, discount, other, custom
- Per-item GST rates with inclusive/exclusive support
- CGST/SGST split (intra-state supply)
- HSN/SAC codes auto-derived from item type
- Live preview matching final PDF layout
- PDF generation (Puppeteer, A4 format)
- Email delivery (SMTP or Ethereal test)
- Payment recording with multiple methods
- Invoice types: tax invoice, proforma, estimate, quotation
- Amount in words (Indian numbering: lakh, crore)
- Bank details on invoice (configurable)
- CSV export

### 6. Reports (`/reports`)
- Revenue analytics with trends
- Occupancy reports
- GST reports (CGST/SGST breakdown)
- Booking source analysis
- Customer analytics
- Room performance
- Date range filters (today / week / month / quarter / year / custom)
- CSV export for all report types

### 7. Settings (`/settings`)
- Hotel profile: name, address, GSTIN, state
- Bank details: account, IFSC, holder name, branch
- System defaults: currency (INR), GST rate
- Buffet pricing (breakfast / lunch / dinner)
- Invoice terms & conditions
- Email configuration

### 8. Admin (`/admin`)
- User management (admin/manager only)
- Role-based access control

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers (search, pagination) |
| GET | `/api/customers/[id]/invoices` | Customer's invoices |
| GET/PUT | `/api/hotel/config` | Hotel configuration |
| GET | `/api/invoice/item-types` | Custom invoice item types |
| GET/POST | `/api/invoices` | List / create invoices |
| GET/PUT/DELETE | `/api/invoices/[id]` | Single invoice CRUD |
| POST | `/api/invoices/[id]/email` | Email invoice to customer |
| POST | `/api/invoices/[id]/payments` | Record invoice payment |
| GET | `/api/invoices/[id]/pdf` | Download invoice PDF |
| POST | `/api/invoices/preview/pdf` | Preview PDF from form data |

---

## Authentication & Authorization

- **Supabase Auth** with email/password login
- **Middleware** (`src/middleware.ts`) guards all routes except `/login` and `/auth`
- **Role-based access**: admin routes require `admin` or `manager` role from `profiles` table
- Session managed via `@supabase/ssr` cookies (auto-refresh)

---

## GST Calculation Logic

Two independent GST systems:

### 1. Booking GST (`src/lib/utils/gst.ts`)
- Fixed 12% GST rate for hotel services
- Modes: `inclusive` (back-calculate tax), `exclusive` (add tax on top), `none`
- Handles room charges, extra beds, additional charges
- Produces `BookingCalculation` with full breakdown

### 2. Invoice GST (`src/lib/utils/invoice-calculations.ts`)
- Per-line-item variable GST rates
- Discount support (percentage-based)
- `calculateLineItem()` → per-item totals
- `calculateInvoiceTotal()` → aggregate
- `calculateGSTBreakdown()` → grouped by rate for GST summary table
- `formatCurrency()` → `Intl.NumberFormat` en-IN
- `numberToWords()` → Indian numbering (lakh, crore)

---

## Validation

### Client-side (`src/lib/validations/schemas.ts`)
Zod schemas for:
- **Customer**: name, email, phone (+91), ID type, ID number, address, PIN code
- **Booking**: room, dates, guests, rates, payment
- **Room**: room number, type, rates

### Server-side (`src/lib/utils/validation.ts`)
Additional server validation for API routes.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GST (public)
NEXT_PUBLIC_GST_NUMBER=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# AWS S3 (ID photo uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase project (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/yadnesh/hotel-pride.git
cd hotel-pride

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Fill in Supabase URL, anon key, and service role key

# Run migrations on Supabase
# Apply supabase/migrations/*.sql in order via Supabase dashboard or CLI

# Create admin user
# Run supabase/create_admin_user.sql

# Start dev server
npm run dev
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E tests |

---

## Testing

### Unit Tests (Vitest)
- `src/lib/utils/gst.test.ts` — GST calculation edge cases
- `src/lib/utils/invoice-calculations.test.ts` — Invoice math
- `src/lib/utils/validation.test.ts` — Server validation
- `src/lib/validations/schemas.test.ts` — Zod schema validation

### E2E Tests (Playwright)
- `e2e/auth.spec.ts` — Login / logout flows
- `e2e/dashboard.spec.ts` — Dashboard loads, stats display
- `e2e/bookings.spec.ts` — Booking CRUD
- `e2e/customers.spec.ts` — Customer CRUD
- `e2e/invoices.spec.ts` — Invoice create / view / PDF
- `e2e/rooms.spec.ts` — Room grid, status changes
- `e2e/settings.spec.ts` — Hotel config save
- `e2e/reports.spec.ts` — Reports page loads
- `e2e/gst-report.spec.ts` — GST report accuracy
- `e2e/a11y.spec.ts` — Accessibility (axe-core)

---

## Deployment

Deployed on **Vercel** with automatic builds from git.

```bash
# Deploy to production
vercel --prod
```

**Branch:** `feature/reports-and-supabase`

---

## Design Principles

1. **Speed** — Turbopack dev, SSR/SSG hybrid, minimal JS
2. **Clarity** — Simple hotel/front-desk terminology, no decorative clutter
3. **Indian compliance** — GST (CGST/SGST), HSN/SAC, Indian numbering, ₹ INR
4. **Low training cost** — Familiar patterns, accessible controls, clear labels
5. **Data safety** — Never reset/delete without explicit user action
6. **Accessibility** — Labels, aria-labels, visible focus states
7. **Internationalisation** — `Intl` for dates, times, numbers, currency

---

## Migrations History

| # | Migration | Purpose |
|---|-----------|---------|
| 001 | `initial_setup` | profiles, hotel_config, rooms, customers, bookings + RLS |
| 002 | `configure_rooms` | Seed 18 rooms with types and rates |
| 003 | `add_extra_bed` | Extra bed fields on bookings |
| 004 | `customer_id_photos_array` | ID photo URL array on customers |
| 005 | `storage_rls_policies` | Supabase storage RLS for photos |
| 006–007 | `available_rooms_function` | `get_available_rooms()` DB function |
| 008 | `booking_extra_fields` | Additional booking columns |
| 010 | `valid_dates` | Booking date constraints |
| 011 | `payment_status` | Payment status enum on bookings |
| 012 | `checkin_checkout_times` | Time fields on bookings |
| 013 | `simplify_room_types` | Consolidate room type enum |
| 014–017 | `available_rooms` enhancements | Advance booking, AC filtering |
| 018 | `create_invoice_system` | invoices, line_items, payments tables |
| 019 | `sample_invoice_data` | Seed sample invoices |
| 020 | `enhance_invoice_system` | Custom item types, bank details, buffet |
| 021 | `invoice_number_generation` | Auto-increment invoice numbers |
| 022 | `enhance_hotel_config` | Extended hotel config columns |
| 023 | `reconcile_hotel_config` | Align config with app expectations |
| 024 | `auto_booking_number` | Auto-generate booking numbers |
