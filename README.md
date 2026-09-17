# Studio Inventory

A catalog of handmade pottery: what's available, what's sold, and the
patterns/colors behind each piece. Built with Next.js (App Router),
Prisma/Postgres, and Tailwind, per the product's PRD.

The whole site is one set of pages. Anonymous visitors (buyers, retail
partners) see a read-only public catalog. Logging in as an admin unlocks
editing, internal notes (difficulty/enjoyment/preference/value, wholesale
cost), and pattern/color management on the same pages.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` / `DIRECT_URL` — a Postgres connection string. For local
     development, easiest is a local Postgres (`createdb pottery`, then
     `postgresql://localhost/pottery` for both). See "Deploying" below for
     the hosted equivalent.
   - `ADMIN_PASSWORD` — the password that unlocks admin mode. Pick something
     real before deploying.
   - `SESSION_SECRET` — random string signing the admin session cookie.
     Generate one with `openssl rand -hex 32`.
   - `ANTHROPIC_API_KEY` — optional. If set, the "Add new product" page can
     call Claude's vision API to guess a name/category/pattern/colors from
     uploaded photos. If unset, that button is simply hidden and the form
     still works with manual entry.
   - `BLOB_READ_WRITE_TOKEN` — optional locally. Leave blank and uploaded
     photos are written to `public/uploads/` on disk instead, which is fine
     for local dev. Required in production (see below).

3. Create the database:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`. Go to `/admin/login` and sign in with
   `ADMIN_PASSWORD` to manage inventory.

## Deploying (Vercel + a domain you own)

This app needs a real server (Server Actions, a database, file uploads) —
it can't run on static hosting like GitHub Pages. Vercel is the natural fit
since it's built by the Next.js team and has a generous free tier.

### 1. Push this repo to GitHub

You've already got that part done if you're reading this from the repo.

### 2. Create a Postgres database

Pick one (both have a free tier and give you the two connection strings
this app wants):

- **Neon** (neon.tech) — sign up, create a project, copy the "pooled
  connection" string into `DATABASE_URL` and the "direct connection" string
  into `DIRECT_URL`.
- **Vercel Postgres** — created from inside your Vercel project's Storage
  tab (see step 4); it fills in both env vars for you automatically.

### 3. Create a Blob store for product photos

In your Vercel project's **Storage** tab, add a **Blob** store. Connecting
it to the project automatically sets `BLOB_READ_WRITE_TOKEN` as an env var
— you don't need to copy anything by hand.

### 4. Import the project into Vercel

- Go to vercel.com → **Add New Project** → import this GitHub repo.
- Vercel detects Next.js automatically; no build settings to change.
- Under **Environment Variables**, add (if not already set by connecting
  Postgres/Blob in steps 2–3): `ADMIN_PASSWORD`, `SESSION_SECRET`, and
  optionally `ANTHROPIC_API_KEY`.
- Deploy. The build runs `prisma migrate deploy` automatically (see
  `package.json`), so the database schema is created on first deploy and
  updated automatically on every deploy after that.

### 5. Point your domain at it

In the Vercel project's **Settings → Domains**, add the domain you own.
Vercel gives you either:
- an **A record** (or **ALIAS/ANAME**) to add at your domain's DNS
  provider for the bare domain (`example.com`), or
- a **CNAME record** for a subdomain (`shop.example.com`).

Add that record with whoever you registered/manage DNS through (the
registrar, or wherever you pointed your nameservers). Vercel issues a free
SSL certificate automatically once DNS resolves — this can take a few
minutes to a few hours depending on DNS propagation.

### After that

Every push to your main branch redeploys automatically. Go to
`https://your-domain.com/admin/login` and sign in with `ADMIN_PASSWORD` to
start adding inventory.

## How it's organized

- `prisma/schema.prisma` — data model: `Product`, `Pattern`, `Color`,
  `ProductImage`, and the `Product`↔`Color` join table.
- `app/actions/*.ts` — all mutations (create/update/delete product, pattern,
  color; image upload/delete; login/logout; AI analyze) as Next.js Server
  Actions. Every mutation except login re-checks `isAdmin()` server-side.
- `lib/auth.ts` — password check + signed, httpOnly session cookie. No user
  accounts; this is a single shared admin password by design (see the PRD).
- `lib/ai.ts` — Claude vision call used by "Add new product" to pre-fill the
  form from photos.
- `lib/uploads.ts` — saves uploaded photos to Vercel Blob when
  `BLOB_READ_WRITE_TOKEN` is set (production), or to `public/uploads/` on
  disk otherwise (local dev). Also handles best-effort cleanup when an
  image or product is deleted, so Blob storage doesn't accumulate orphaned
  files.
- `components/ProductPublicView.tsx` vs `components/ProductDetailPanel.tsx`
  — the product page renders one or the other depending on admin status.
  This split is deliberate: `ProductDetailPanel` is a Client Component, and
  any prop handed to a Client Component gets serialized into the page's
  HTML/RSC payload for hydration — so it must never be mounted for an
  anonymous visitor, even if its own render logic would hide the internal
  fields. Anonymous requests get the plain server-rendered public view
  instead, which never receives wholesale cost, difficulty/enjoyment/
  preference, or favorite in the first place.

## Public share link

There's no separate "public" route — the public view *is* the normal site,
served to anyone without a valid admin session cookie. Send buyers the same
homepage/category/product URLs you use yourself; they just won't see
internal fields or admin controls.

## Branding

The header renders the studio's logo (`public/brand/logo.png`, extracted
from the PRD) via `components/Logo.tsx`. Replace that file to swap logos —
update the `width`/`height` props to match the new image's aspect ratio.

## Notes on scope vs. the PRD

- "Value" (`enjoyment + preference − difficulty`) is computed on the fly
  from each pattern's scores rather than stored, so editing a pattern's
  scores immediately updates value everywhere it's shown.
- A new pattern/color created inline while adding a product (via the "+ Add
  new pattern/color" option in the picker dropdowns) is created immediately
  through the same Server Action as the standalone Manage Patterns/Colors
  pages, then selected for that product.
- A pattern created inline during product upload gets its reference image
  set automatically to the first photo uploaded for that product, per the
  PRD. A pattern created from the Manage Patterns page takes a direct image
  upload instead, since there's no product photo to borrow from yet.
