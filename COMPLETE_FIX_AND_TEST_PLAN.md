# Hotel Pride Complete Fix And Test Plan

This document is a handoff plan for any AI agent or engineer continuing the work. It is intentionally detailed so the project can continue even without the original conversation.

## Current Repository Snapshot

Stack:
- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Supabase client/server wrappers with a local JSON mock database
- Tailwind CSS 4 and shadcn-style UI primitives
- Hotel/front-desk modules: dashboard, rooms, bookings, customers, invoices, reports, settings, admin

Important files:
- App routes: `src/app`
- UI components: `src/components`
- Supabase mock/client/server: `src/lib/supabase`
- Business calculations: `src/lib/utils`
- Database migrations: `supabase/migrations`
- Mock data: `db-mock.json`

Changes already started before this plan:
- Added `AGENTS.md`.
- Installed test dependencies and added scripts for `test`, `typecheck`, and `test:e2e`.
- Added Vitest config and initial tests for GST and invoice calculations.
- Added Playwright config and smoke E2E tests.
- Fixed invoice GST-inclusive discount calculation.
- Began TypeScript fixes in realtime callbacks, signed URL helpers, invoice reducers, and mock DB result typing.

Before continuing, run:

```bash
git status --short
npm test
npm run typecheck
npm run build
```

Do not revert existing changes unless the user explicitly asks.

## Product Goal

Make Hotel Pride simple, reliable, and understandable for a tier 2-3 city hotel front desk.

Principles:
- Minimal UI.
- Plain language.
- No fake or placeholder operational data.
- Fast paths for common desk work: check room, create booking, add customer, take payment, generate invoice.
- Every risky logic path covered by automated tests.
- E2E smoke and critical-path coverage on desktop and mobile.

## High-Level Execution Order

1. Stabilize tooling.
2. Make TypeScript, lint, build green.
3. Expand unit tests for business rules.
4. Expand integration tests for API/mock Supabase behavior.
5. Refactor UI flow by flow.
6. Add E2E coverage for every user journey.
7. Add accessibility, responsive, and visual regression checks.
8. Run full verification.
9. Produce final report of fixes, known risks, and test coverage.

## Phase 1: Stabilize Tooling

Tasks:
- Confirm `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` exist and run.
- Replace invalid `next lint` script with `eslint .` if not already done.
- Ensure Vitest excludes E2E tests and Playwright excludes unit tests.
- Ensure Playwright web server uses the same mock auth/database path as development.
- Add `test-results/`, `playwright-report/`, and coverage output to `.gitignore` if missing.
- Decide whether `tsconfig.tsbuildinfo` should remain tracked. Usually remove from git if tracked, but do not delete without checking history/user intent.

Exit criteria:
- Tool commands start successfully.
- Any failing command has a documented failure list.

## Phase 2: TypeScript, Lint, Build Green

Known build/type risks:
- `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` use many `any` values and unused parameters.
- `src/lib/supabase/mock-db.ts` uses broad `any` and has result shape mismatch around `count`.
- `src/middleware.ts` has unused variables and swallowed JSON parse errors.
- Realtime payload callbacks lack typing.
- Customer signed URL helpers have weak return typing.
- Some route-group page files have implicit callback types.

Tasks:
- Create shared mock Supabase types:
  - `MockFilter`
  - `MockPayload`
  - `MockQueryResult<T>`
  - `MockTableName`
  - `MockRecord`
- Replace broad `any` in mock DB with `unknown`, `Record<string, unknown>`, or specific table row types where feasible.
- Use underscore names for intentionally unused callback parameters.
- In middleware, remove unused Supabase client creation if the app only uses mock cookies there, or actually validate session if Supabase auth is intended.
- Do not suppress lint rules globally unless absolutely necessary.

Exit criteria:
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 3: Business Logic Unit Tests

Use TDD: write failing tests first, then fix implementation.

### GST Tests

Cover:
- Inclusive GST.
- Exclusive GST.
- No GST.
- Zero amount.
- Decimal amounts.
- Large amounts.
- Negative amount validation, if supported.
- Rounding to 2 decimals.
- Extra beds with 0, 1, many beds.
- Additional charges empty, one item, many items.
- Custom room rate lower/higher than base.
- 1 night, multiple nights, same-day hourly if product supports it.

Matrix:
- GST mode: `inclusive`, `exclusive`, `none`
- Room rate: `0`, `1`, `999.99`, `1000`, `1120`, `100000`
- Nights: `0`, `1`, `2`, `30`
- Extra bed quantity: `0`, `1`, `3`
- Extra bed rate: `0`, `250`, `999.99`
- Additional charges: `[]`, `[food]`, `[food, service, discount-like charge]`

### Invoice Calculation Tests

Cover:
- Tax exclusive item without discount.
- Tax exclusive item with discount.
- Tax inclusive item without discount.
- Tax inclusive item with discount.
- GST rate 0, 5, 12, 18, 28.
- Discount 0, 10, 100.
- Quantity 0, 1, fractional if allowed, large.
- Negative unit price validation.
- Buffet items based on persons count and price per person.
- Multiple line items with mixed tax modes.
- `numberToWords` for 0, 1, 10, 99, 100, 999, 1000, lakh, crore, rupees and paise.
- GST breakdown grouping by rate.

Matrix:
- Item type: `room`, `food`, `service`, `extra`, `discount`, `other`, `custom`
- GST inclusive: `true`, `false`
- GST rate: `0`, `5`, `12`, `18`, `28`
- Discount: `0`, `10`, `100`
- Quantity: `0`, `1`, `2`, `10`
- Unit price: `0`, `1`, `500`, `1000.50`

### Booking Validation Tests

Cover:
- Missing room.
- Missing customer.
- Missing primary guest.
- Check-in before today.
- Check-out before check-in.
- Same-day booking with checkout time before/equal/after check-in time.
- Adults 0, 1, many.
- Children 0, many, negative.
- Total guests lower/equal/higher than adults + children.
- Guest count above room occupancy.
- Rate 0, positive, negative.
- Payment 0, partial, exact, overpayment.
- GST inclusive and exclusive.
- Extra bed allowed and not allowed.
- Edit existing booking with occupied current room.

Matrix:
- Booking status: `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show`
- Payment status: `pending`, `partial`, `paid`, `refunded`
- Date relation: `past`, `today`, `future`, `same_day`, `checkout_before_checkin`
- Room status: `available`, `occupied`, `cleaning`, `maintenance`
- Guest mix: `1 adult`, `2 adults`, `1 adult + child`, `0 adults`

### Customer Validation Tests

Cover:
- Required fields.
- Indian phone formats with and without `+91`, depending product decision.
- PIN code format.
- Email optional and invalid email.
- ID types: Aadhaar, PAN, Passport, Driving License, Voter ID.
- Duplicate phone or ID handling.
- Photo upload paths and signed URLs.
- Blacklist flag and reason.

### Room Logic Tests

Cover:
- Status transitions:
  - available to occupied on check-in.
  - occupied to cleaning on checkout.
  - cleaning to available.
  - maintenance blocks booking.
- AC and non-AC rates.
- Extra bed capability.
- Room type filtering.
- Occupancy capacity.

### Auth And Permission Tests

Cover:
- Signed out user redirected to login.
- Signed in user redirected away from login.
- Admin can access admin routes.
- Manager can access allowed admin routes if intended.
- Staff/receptionist blocked from admin.
- Logout clears cookie/localStorage.
- Corrupt auth cookie fails safely.

## Phase 4: Integration Tests

Targets:
- `src/app/api/supabase-mock/route.ts`
- Customer APIs.
- Invoice APIs.
- Hotel config API.
- Supabase mock DB query behavior.

Test cases:
- Select with `eq`, `neq`, `in`, `gte`, `lte`, `gt`, `lt`.
- Select with ordering ascending/descending.
- Select with limit.
- Select with `single`.
- Select with `count` and `head`.
- Insert single and array.
- Insert booking auto-generates booking number.
- Insert invoice auto-generates invoice number.
- Update booking changes room status.
- Delete removes records or soft-deletes if intended.
- RPC `get_available_rooms` excludes overlapping bookings.
- RPC `generate_invoice_number_by_type`.
- Error for unknown table.
- Error for unknown RPC.
- Persistence to `db-mock.json`.

## Phase 5: UI Refactor Plan

Apply this flow-by-flow. Do not rewrite all components at once.

### Global UI

Tasks:
- Make layout denser and calmer.
- Use one primary action per screen.
- Remove repeated explanations.
- Remove placeholder operational content.
- Standardize page headers:
  - Title
  - One short description only where useful
  - Primary action
- Standardize empty states:
  - What happened
  - What to do next
  - One action
- Add labels/aria labels for icon-only controls.
- Keep cards only for repeated items or framed tools; avoid cards inside cards.
- Keep text plain:
  - “Bookings” instead of “Booking Management”
  - “New booking” instead of “Create reservation workflow”
  - “Amount due” instead of “Pending payment status”

### Dashboard

Current findings:
- “Today’s Revenue” card appears to show monthly revenue in `DashboardClient`.
- Placeholder recent bookings are hardcoded.
- Helper texts repeat and do not match their cards.
- Tabs duplicate primary navigation.
- Too many card surfaces for simple data.

Refactor:
- Remove dashboard tabs or reduce to direct summary plus room status.
- Show:
  - Available rooms
  - Occupied rooms
  - Check-ins today
  - Check-outs today
  - Payments due
  - Today revenue
- Add direct buttons:
  - New booking
  - View rooms
  - Payments due
- No hardcoded fake bookings.

Tests:
- Dashboard renders correct labels.
- Today revenue uses `todayRevenue`.
- No fake booking numbers appear.
- Empty state appears when there are no bookings.

### Rooms

Refactor:
- Simple room grid with filters:
  - All
  - Available
  - Occupied
  - Cleaning
  - Maintenance
- Room cards should show:
  - Room number
  - AC/non-AC
  - Rate
  - Status
  - Max guests
  - One clear action if available.
- Avoid colorful clutter; status color only.

Tests:
- Filter status combinations.
- Room action availability by status.
- Mobile grid remains readable.

### Bookings

Current findings:
- Too many stats at top.
- Icon-only buttons lack accessible labels.
- Extra “more” action has no behavior.
- Wizard is large and noisy.

Refactor:
- Header: `Bookings`, search, filters, `New booking`.
- Stats: keep only today check-ins, today check-outs, amount due.
- Table columns:
  - Booking
  - Guest
  - Room
  - Dates
  - Due/Paid
  - Status
  - Actions
- Mobile cards with the same essential data.
- Remove action buttons that do nothing.
- Add labels:
  - View booking
  - Edit booking
  - Check in guest
  - Check out guest

Booking wizard:
- Short step labels:
  - Room
  - Guest
  - Payment
  - Review
- Surface validation next to fields, not only top alert.
- Keep draft controls secondary.
- Avoid multiple destructive dialogs unless data loss is likely.

Tests:
- Search by booking number, guest, phone, room.
- Filter by status, payment, date, and combined filters.
- Check-in only appears for confirmed bookings due today or earlier.
- Check-out only appears for checked-in bookings.
- New booking wizard cannot advance with missing required fields.

### Customers

Refactor:
- Header: `Customers`, search, `Add customer`.
- List should show:
  - Name
  - Phone
  - ID type/last digits
  - Last stay/booking count if reliable
  - Blacklist flag
- Add simple empty state.
- Customer form:
  - Basic details
  - ID details
  - Address
  - Notes
- Photo upload should clearly show upload status and existing photos.

Tests:
- Add customer happy path.
- Required fields validation.
- Edit customer preserves existing photos.
- Search works.
- Blacklisted customer is visible and cannot be missed.

### Invoices

Refactor:
- Header: `Invoices`, filters, `New invoice`.
- Make amounts legible:
  - Total
  - Paid
  - Balance
- Invoice form should have:
  - Customer
  - Line items
  - Tax/discount
  - Payment
  - Preview
- Avoid duplicate invoice forms if `InvoiceForm` and `EnhancedInvoiceForm` overlap. Pick one after verifying behavior.

Tests:
- Create invoice with one room item.
- Create invoice with mixed line items.
- Tax inclusive/exclusive combinations.
- Add payment partial/exact/overpayment.
- Download PDF.
- Email invoice handles success/failure.

### Settings

Refactor:
- Plain sections:
  - Hotel details
  - GST and invoice settings
  - Bank details
  - Default timings
- Save button always visible at bottom or header.
- Show success/error clearly.

Tests:
- Load settings.
- Save valid settings.
- Reject invalid GST/PIN/phone/email.

### Admin

Refactor:
- Keep minimal.
- Users table with role/status/action.
- Permission errors should be clear.

Tests:
- Role access matrix.
- Create/update/deactivate user if feature exists.

## Phase 6: E2E Test Matrix

The user requested every permutation and combination. Some combinations are combinatorially huge, so use two levels:
- Exhaustive coverage for critical business rules in unit/integration tests.
- Pairwise and risk-based coverage for UI E2E, plus explicit critical scenarios.

### Browsers And Devices

Run E2E on:
- Chromium desktop.
- Mobile viewport.
- Add Firefox/WebKit later if time allows.

Viewport matrix:
- Desktop: 1440x900
- Laptop: 1280x720
- Tablet: 768x1024
- Mobile: 390x844

### Auth E2E

Cases:
- Login with valid credentials.
- Login missing email.
- Login missing password.
- Login invalid email format.
- Password visibility toggle.
- Redirect to requested page after login.
- Logout.
- Protected route redirects to login.
- Admin route blocked for non-admin.

### Dashboard E2E

Cases:
- Dashboard loads after login.
- Summary cards visible.
- New booking action opens wizard.
- View rooms action navigates.
- Payments due action navigates/filter if available.
- No placeholder records.
- Mobile navigation opens/closes.

### Rooms E2E

Cases:
- Rooms page loads.
- Filter all statuses.
- Search/filter by room number if available.
- Available room can start booking.
- Occupied room does not show booking action.
- Cleaning/maintenance status visible.
- Mobile cards do not overflow.

### Bookings E2E

Create booking combinations:
- Room type: AC double, non-AC double, executive, VIP.
- Date: today, future, same-day if supported.
- Guests: 1 adult, 2 adults, adult + child, capacity edge.
- Extra bed: none, one, max allowed.
- GST: inclusive, exclusive.
- Payment: none, partial, full.

Booking list combinations:
- Search by booking number.
- Search by guest name.
- Search by phone.
- Search by room.
- Status filter each status.
- Payment filter each payment status.
- Date filter today/upcoming/current/past.
- Combined filters that return results.
- Combined filters that return empty state.

Booking lifecycle:
- Confirmed to checked-in.
- Checked-in to checked-out.
- Cancelled booking cannot be checked in.
- Paid booking shows no due amount.
- Partial booking shows due amount.

Booking edit:
- Edit dates.
- Edit room.
- Edit guest.
- Edit payment.
- Cancel edit without losing original.

### Customers E2E

Cases:
- Add customer minimum required data.
- Add customer with full address and notes.
- Add customer with each ID type.
- Invalid phone.
- Invalid PIN.
- Invalid email.
- Upload ID photo.
- Edit customer.
- Search customer.
- View customer profile.
- Customer invoices tab/list loads.
- Blacklist customer if feature exists.

### Invoices E2E

Invoice create combinations:
- Customer selected from existing.
- Manual customer if supported.
- Room item only.
- Food item only.
- Service item only.
- Multiple line items.
- GST inclusive.
- GST exclusive.
- Discount 0.
- Discount 10%.
- GST 0, 5, 12, 18.
- Payment none, partial, full.

Invoice lifecycle:
- Draft.
- Sent.
- Paid.
- Overdue if supported.
- Cancelled.
- Add payment.
- Download PDF.
- Preview PDF.
- Email invoice success and failure.

### Settings E2E

Cases:
- Load current hotel config.
- Edit hotel name.
- Edit address.
- Edit GST number.
- Edit default GST rate.
- Edit check-in/out times.
- Edit bank details.
- Save success.
- Validation failure.

### Reports E2E

Cases:
- Reports page loads.
- Date range filters if present.
- Empty data state.
- Revenue summary matches mock bookings.
- Export if present.

### Admin E2E

Cases:
- Admin page loads for admin.
- User table loads.
- Non-admin blocked.
- Role/status controls if present.

## Phase 7: Accessibility And UI QA

Automated:
- Add `@axe-core/playwright`.
- Run axe on every top-level page.
- Assert no serious/critical violations.

Manual/visual checklist:
- Keyboard-only navigation.
- Focus visible.
- Dialog focus trap.
- Escape closes dialogs.
- Icon-only buttons have labels.
- Labels connected to inputs.
- Tables readable on desktop.
- Cards readable on mobile.
- No horizontal scroll except intentional tables.
- Loading, empty, error, and success states visible.
- Toasts do not hide primary controls.

Pages to inspect:
- Login
- Dashboard
- Rooms
- Bookings
- Booking wizard all steps
- Customers
- Customer form
- Customer profile
- Invoices
- Invoice form
- Invoice preview
- Settings
- Admin

## Phase 8: Data And Database Review

Tasks:
- Review all migrations in order.
- Confirm room count and room types match product expectations.
- Confirm RLS policies exist for storage and user data.
- Confirm invoice number generation cannot collide.
- Confirm booking overlap function handles:
  - Same-day checkout/check-in.
  - Cancelled bookings.
  - Checked-out bookings.
  - Time-level overlap if same-day bookings exist.
- Confirm hotel settings schema matches UI fields.

Supabase-specific tests:
- `get_available_rooms` with no bookings.
- Booking overlap exact same dates.
- Booking adjacent dates.
- Booking fully inside another booking.
- Booking fully surrounding another booking.
- Cancelled booking ignored.
- Maintenance room excluded.

## Phase 9: Security And Reliability

Tasks:
- Remove sensitive data from committed mock files if any.
- Ensure env vars are not hardcoded.
- Validate all API route inputs with Zod or equivalent.
- Avoid trusting client-side totals for invoice/booking amounts.
- Recalculate totals server-side before insert/update.
- Ensure uploads validate file type and size.
- Ensure PDF/email endpoints check auth.
- Add error boundaries around dashboard shell and forms.

## Phase 10: Final Verification Command Set

Run in this order:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

If Playwright browsers are missing:

```bash
npx playwright install
```

Also run:

```bash
npm audit
```

Do not run `npm audit fix --force` without approval because it can introduce breaking dependency changes.

## Suggested Work Breakdown For Future Agents

Agent 1: Build and TypeScript stabilization
- Finish strict typing in Supabase mock/client/server.
- Make `typecheck`, `lint`, and `build` pass.

Agent 2: Business logic tests
- Expand GST, invoice, booking validation, room availability tests.
- Fix calculation/validation defects.

Agent 3: UI simplification
- Dashboard, bookings, booking wizard, customers.
- Use the UI refactor rules above.

Agent 4: Invoices and settings
- Consolidate invoice forms.
- Test PDF/payment/email/config flows.

Agent 5: E2E and accessibility
- Expand Playwright suite.
- Add axe checks.
- Capture screenshots for desktop/mobile.

## Definition Of Done

The work is done only when:
- `npm test` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:e2e` passes on desktop and mobile.
- Core flows are visually checked.
- Accessibility critical/serious issues are fixed.
- No fake placeholder operational data remains.
- Every form has loading, success, error, empty, and validation states.
- Final handoff lists changed files, tests run, remaining risks, and any intentionally deferred items.
