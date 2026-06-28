# AGENTS.md

## Project

Hotel Pride is a Next.js hotel-management app for a small-city front desk team. Build for speed, clarity, and low training cost.

## Working Rules

- Prefer small, tested changes over broad rewrites.
- Keep UI copy simple and direct. Use familiar hotel/front-desk terms.
- Avoid decorative clutter, nested cards, and placeholder records.
- Preserve user work. Do not reset or delete data unless the user explicitly asks.
- Use accessible controls: labels for fields, `aria-label` for icon-only buttons, and visible focus states.
- Use `Intl` for dates, times, numbers, and INR currency.
- Add or update tests before fixing behavior where practical.

## Verification

- Run unit tests for calculation and validation changes.
- Run lint/type/build checks before handoff.
- Run E2E smoke flows for login, dashboard, booking list, room list, customer list, invoice list, and settings when UI/navigation changes.
