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

   - `POSTGRES_URL` — a plain Postgres connection string. For local
     development, easiest is a local Postgres (`createdb pottery`, then
     `postgresql://localhost/pottery`). See "Deploying" below for the
     hosted equivalent.
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

### 2. Import the project into Vercel

Go to vercel.com → **Add New Project** → import this GitHub repo. Vercel
detects Next.js automatically; no build settings to change.

### 3. Create a Postgres database

In the project's **Storage** tab, click **Create Database** and pick a
Postgres-flavored provider — either **Neon** or Vercel's own **Prisma
Postgres** work. The app's schema (`prisma/schema.prisma`) always reads a
variable literally named `POSTGRES_URL`, so after connecting whichever
provider, check the project's **Environment Variables** page for that
exact name:

- **Prisma Postgres** already creates a `POSTGRES_URL` var alongside
  `DATABASE_URL`/`PRISMA_DATABASE_URL` (those two are `prisma+postgres://`
  Accelerate URLs for a Prisma Client setup this app doesn't use — ignore
  them). Nothing more to do here.
- **Neon** typically names its variable `DATABASE_URL` instead. If so, add
  a new env var named `POSTGRES_URL` and paste in that same connection
  string value.

### 4. Create a Blob store for product photos

Same **Storage** tab → **Create Database** (Blob stores live in the same
menu) → **Blob**. This is supposed to auto-add `BLOB_READ_WRITE_TOKEN` to
the project, but in practice it doesn't always show up in the Environment
Variables list. If it's missing: open the Blob store itself (Storage →
your store's name) and look for a "Quickstart" / ".env.local" tab, which
shows a `BLOB_READ_WRITE_TOKEN=...` value you can copy into the project's
Environment Variables by hand.

### 5. Add the remaining environment variables

On the project's **Environment Variables** page, add:
- `ADMIN_PASSWORD` — the password that unlocks admin mode
- `SESSION_SECRET` — random string; generate with `openssl rand -hex 32`
- `ANTHROPIC_API_KEY` — optional, for the AI photo-guessing feature

Then trigger a deploy (push any commit to the tracked branch — the
Deployments tab should show it building). The build runs `prisma generate
&& prisma migrate deploy` before `next build` (see `package.json`), so the
database schema is created on first deploy and kept in sync after that. If
the Deployments list stays empty even after importing the project, push a
commit (an empty one is fine: `git commit --allow-empty -m "Trigger
deploy"`) to fire it manually — Vercel's initial auto-deploy on import
doesn't always fire.

### 6. Point your domain at it

On the project's **Domains** page, add the domain (or subdomain) you own —
e.g. `inventory.example.com` if you want it on a subdomain rather than the
bare domain. Vercel shows you the DNS record to add:
- a **CNAME** record for a subdomain (most common — e.g. host `inventory`,
  value `cname.vercel-dns.com`, exactly as shown, not substituted), or
- an **A**/**ALIAS** record for the bare root domain.

Add that record wherever you manage DNS for the domain (your registrar's
dashboard, unless you've pointed nameservers elsewhere). Vercel issues a
free SSL certificate automatically once DNS resolves — anywhere from a few
minutes up to the 24–48 hour window your DNS provider may warn about, in
practice usually much faster.

### After that

Every push to the tracked branch redeploys automatically. Go to
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
