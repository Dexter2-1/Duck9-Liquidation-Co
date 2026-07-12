# Dock9 — Pallet Liquidation Storefront + Admin Panel

One Next.js project containing **both**:
- The public storefront (`/`) — customers browse the live load board and check out.
- The admin panel (`/login`, `/dashboard`, `/products`, `/manifest`, `/orders`, `/activity`, `/settings`) — you manage inventory, orders, and site content.

Both sides read and write the **same database** — a pallet you hide in the admin panel disappears from the storefront instantly; an order placed on the storefront shows up in the admin Orders tab with a live timer.

## Run it locally

This project is set up to use Postgres (not SQLite), so it needs a real database connection string even for local development — the simplest path is to point it at the same database you use for deployment (Neon or Netlify Database — see "Deploying" below), so there's only one database to think about instead of a separate local one.

```bash
npm install
```

Then in `.env`, set `DATABASE_URL` to your Postgres connection string (see the deployment section for how to get one), and run:

```bash
npx prisma migrate deploy
npm run seed
npm run dev
```

- Storefront: http://localhost:3000
- Admin login: http://localhost:3000/login

**Seeded admin logins** (password `password123` for all):
- `admin@dock9.example` — ADMIN
- `manager@dock9.example` — MANAGER
- `warehouse@dock9.example` — WAREHOUSE

## What's new since the admin-only build

- **Site Settings page** (`/settings` in the admin panel) — edit company name, hero tagline, support email/phone, hours, headquarters address, and the full warehouse list. Every field shows up live in the storefront footer and checkout (pickup warehouse dropdown pulls from this list).
- **Storefront is now database-backed**, not a static mock. It calls `/api/public/products` and `/api/public/settings` — no hardcoded data left.
- **Real checkout** — `/api/public/orders` creates a real Order in the database, decrements pallet stock, and marks a pallet SOLD when it hits zero. No more fake client-only confirmation.
- Card fields on checkout are still UI-only — no payment processor is wired up. See "Adding real payments" below.

## Deploying to GitHub + Netlify

The project is already set up for Postgres (see `prisma/schema.prisma`) — no code changes needed before deploying.

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Dock9 storefront + admin panel"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

### 2. Import into Netlify
On [netlify.com](https://netlify.com): **Add new site → Import an existing project → GitHub** → pick your repo → Deploy. Netlify detects `netlify.toml` (already included) and uses the official Next.js plugin automatically. This first deploy won't fully work yet — that's expected, the database isn't connected yet.

### 3. Add a database
Two options:
- **Netlify Database** (simplest — no separate signup): on your site, go to **Databases** in the sidebar and provision one in a click. Netlify creates a variable called `NETLIFY_DATABASE_URL`. Go to **Site settings → Environment variables**, copy that value, then create a **new** variable named exactly `DATABASE_URL` with the same value pasted in (the code looks for that name specifically).
- **Standalone Neon** (neon.tech): create a free project, copy its connection string, add it as `DATABASE_URL` directly.

### 4. Add the other environment variables
Still under **Environment variables**, add:
- `JWT_SECRET` — any long random string
- `NEXT_PUBLIC_APP_URL` — leave blank for now, come back once you have your live URL (step 6)
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — optional, only needed for order notification emails (see "How orders and payment actually work" below)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — optional, only needed for SMS order alerts
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional, only needed for direct photo uploads
- `ANTHROPIC_API_KEY` — optional, only needed for the AI description writer

### 5. Set up the database's tables and demo data
From your own terminal, using the same connection string from step 3:
```bash
DATABASE_URL="your-connection-string" npx prisma migrate deploy
DATABASE_URL="your-connection-string" npm run seed
```
(Re-running `seed` wipes and reseeds — skip it once you have real data you don't want to lose.)

### 6. Redeploy and finish up
**Deploys → Trigger deploy → Deploy site**. Once live, copy your Netlify URL (like `https://something.netlify.app`), go back to **Environment variables**, set `NEXT_PUBLIC_APP_URL` to that exact URL, and trigger one more deploy.

That's it — one repo, one Netlify site, storefront and admin both live at your Netlify domain. Admin login is at `/login`.

## How orders and payment actually work

This is built for **manual payment**, not a card processor:

1. A customer checks out on the storefront — no card details are collected. Submitting reserves the pallet(s) and creates an order marked `UNPAID`.
2. A professional PDF invoice is generated automatically and **emailed to the customer and to your admin notification email at the same time** — itemized pallets, subtotal, any discount, amount due, and your payment instructions. Same thing happens when you accept a "Make an Offer" submission.
3. The customer also sees your **payment instructions** (set in `/settings`) right on the confirmation screen — e.g. "We accept Zelle, Venmo, Chime, Apple Pay, and Cash App."
4. Once you've actually received the Zelle/Venmo/wire payment, go to **Orders** in the admin panel and click **Mark paid**. Marking an order shipped also emails the customer their tracking update.

### Invoices

Invoices are real PDFs, generated with `pdf-lib` (pure JS, no headless browser needed — this matters because Puppeteer-style PDF tools generally don't run on Netlify's serverless functions, and pdf-lib does). Each invoice includes your company info, the order number, itemized pallets with quantities and line totals, subtotal, any discount applied and why, amount due, and your payment instructions. No setup required — this works as soon as the app is running. Layout/branding lives in `src/lib/invoice.ts` if you want to adjust it later.

### Enabling real emails

Order notification emails (including the invoice PDF attachment) use [Resend](https://resend.com) (a simple transactional email API). Without credentials, emails are just logged to the server console instead of failing — orders still go through fine either way, you just won't get notified until you configure this:

1. Sign up at resend.com, verify a sending domain (or use their test domain while developing).
2. In `.env`, set:
   ```
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="orders@yourdomain.com"
   ```

### Enabling SMS order alerts

Alongside email, you can get a text the moment an order comes in, via [Twilio](https://twilio.com):

1. Sign up at twilio.com, buy a phone number (a few dollars/month).
2. In `.env`, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` (your Twilio number).
3. In the admin panel, go to **Site Settings** and set "Admin notification phone" to your personal cell in international format (e.g. `+17045550139`).

Without Twilio configured, or without a phone number set in Settings, SMS is just skipped — email notifications still work independently.

### Enabling real photo uploads

Pallet photos can be uploaded directly (not just pasted as URLs) via [Cloudinary](https://cloudinary.com), which has a generous free tier:

1. Sign up at cloudinary.com — your dashboard shows Cloud Name, API Key, and API Secret immediately.
2. In `.env`, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. On a pallet's detail page (or Quick Add), use the file picker to upload directly from your device — no need to host photos elsewhere first.

Without Cloudinary configured, the upload button shows a clear setup error — the manual "paste a photo URL" field still works as a fallback either way.

## Editing and cancelling orders

Click any order number (or "Edit") in the Orders tab to open its detail page. From there you can:

- **Edit customer/fulfillment details** — name, email, phone, delivery address or pickup warehouse.
- **Change quantities or remove a pallet from the order** — stock is automatically reconciled (increasing a quantity checks and deducts available stock; decreasing or removing releases it back to the load board). An order can't be edited down to zero items — use Cancel instead if that's the goal.
- **Cancel the order** — releases all reserved stock back to the load board, marks it CANCELLED, and emails the customer. This is separate from deleting anything — cancelled orders stay visible (grayed out) in the Orders list for your records.

Search boxes were also added to the **Products** and **Orders** tables (by SKU, title, category, customer, or email) — no schema changes were needed for any of this, so there's nothing extra to run against your deployed database.

## New: reviews, offers, customers, and category browsing

Inspired by a review of usapalletliquidators.com, this round added:

- **Individual pallet pages** at `/pallet/[id]` — full photo gallery, description, and pallet-specific reviews, linked from every load board card.
- **Reviews** — customers can leave a star rating + comment on any pallet's page (held for approval). Admin moderates them under **Reviews** in the sidebar: approve, feature (shows in the sitewide testimonials section on the homepage), or delete.
- **Make an Offer** — every pallet page has an offer button. Submissions land in **Offers** in the admin panel; accepting one creates a real order at the offered price and emails the customer; declining emails them too. Nothing auto-accepts — a human always decides.
- **Customers** — a customer record is created automatically the first time someone checks out. Under **Customers** in the admin panel, flag a repeat/wholesale buyer with a discount percentage — it's applied automatically on their next order.
- **Manual-payment discount** — configurable in Settings → Payments: give buyers a % off orders over a $ threshold, since Zelle/Cash App/etc. cost you nothing in card fees. If a customer both qualifies for this *and* has a wholesale discount, whichever is bigger applies — they don't stack.
- **Category icon browsing** on the load board, alongside the existing condition filter, plus a "Load More" button so the board doesn't try to render everything at once as your catalog grows.
- **Policy pages** at `/shipping`, `/refunds`, `/terms` — editable text in Settings, linked from the footer.

Cart state now persists across pages (via browser localStorage) since there's more than one storefront page to navigate between.

## Admin password reset

Admins can reset their own password from the login page ("Forgot password?" link) without you needing to touch the database:

1. They enter their email at `/forgot-password`.
2. If it matches an admin account, they get an emailed link (valid for 1 hour) to `/reset-password?token=...`.
3. They set a new password there and are redirected to sign in.

This uses the same Resend email setup as order notifications — see "Enabling real emails" below. Without `RESEND_API_KEY` configured, the reset link is logged to the server console instead of emailed, so you (or they) can still grab it there in local development.

## Analytics


The **Analytics** tab shows revenue and units sold broken down by category and by condition grade, plus average days from listing to sale — all calculated only from orders marked **Paid** (reserved-but-unpaid orders aren't counted as real sales yet). This is the data foundation for the Supplier Scorecard idea from your original brief: once you're tracking which supplier each pallet came from, cross-referencing that against this revenue data tells you which suppliers are actually worth reordering from.

## Adding real card payments (optional, later)

The checkout intentionally does **not** collect card details — it's built around manual payment (Zelle, Venmo, Chime, Apple Pay, Cash App) per your workflow above. If you ever want customers to pay by card automatically instead, the standard path is integrating Stripe Checkout or Stripe Elements into the order flow — a real integration project, not a config toggle. Happy to build that when/if you want it.

## Folder structure

```
pallet-admin/
  netlify.toml
  prisma/
    schema.prisma        # Pallet, Order, Review, Offer, Customer, SiteSettings, User, ActivityLog, etc.
    seed.ts
  src/
    lib/                  # db.ts, auth.ts, activityLog.ts, email.ts, sms.ts, cloudinary.ts, storefrontContext.tsx
    middleware.ts          # protects all /dashboard-side routes
    app/
      page.tsx             # PUBLIC storefront homepage (root route)
      pallet/[id]/page.tsx  # PUBLIC individual pallet page — gallery, reviews, make an offer
      shipping, refunds, terms/page.tsx  # PUBLIC policy pages
      storefront-components.tsx  # shared header/footer/cart-drawer/checkout used by both storefront pages
      storefront.css        # storefront-only styles, isolated from admin's Tailwind classes
      login/page.tsx
      (dash)/               # admin shell: dashboard, products, manifest, orders, offers, reviews, customers, activity, analytics, settings
      api/
        public/             # unauthenticated: products, settings, orders, reviews, testimonials, offers (storefront-facing)
        ...                  # authenticated: products, manifest, orders, offers, reviews, customers, activity, analytics, settings (admin-facing)
```

## Feature status

Everything from the Tier 1 build and the two rounds after it is in place: bulk edit with floor-price enforcement, manifest CSV upload, bin location + grade adjuster, order timer + bulk ship/labels, full activity log, the complete description manager, pallet photos (Cloudinary upload + URL fallback), storefront search, manual-payment checkout with email + SMS alerts, payment status tracking, Analytics, and now reviews/offers/customers/category browsing/policy pages as described above.

Still intentionally not built: differentiated role permissions (all three roles currently see identical admin screens), a public order-status lookup page for customers, fraud/velocity tooling, and live auction-style countdown pricing. Half-built versions of these are worse than none — happy to build any of them for real when you're ready.
