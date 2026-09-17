# Studio Inventory

A catalog of handmade pottery: what's available, what's sold, and the
patterns/colors behind each piece. Built with Next.js (App Router),
Prisma/SQLite, and Tailwind, per the product's PRD.

The whole site is one set of pages. Anonymous visitors (buyers, retail
partners) see a read-only public catalog. Logging in as an admin unlocks
editing, internal notes (difficulty/enjoyment/preference/value, wholesale
cost), and pattern/color management on the same pages.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — leave as `file:./dev.db` for local SQLite.
   - `ADMIN_PASSWORD` — the password that unlocks admin mode. Pick something
     real before deploying.
   - `SESSION_SECRET` — random string signing the admin session cookie.
     Generate one with `openssl rand -hex 32`.
   - `ANTHROPIC_API_KEY` — optional. If set, the "Add new product" page can
     call Claude's vision API to guess a name/category/pattern/colors from
     uploaded photos. If unset, that button is simply hidden and the form
     still works with manual entry.

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
- `components/ProductPublicView.tsx` vs `components/ProductDetailPanel.tsx`
  — the product page renders one or the other depending on admin status.
  This split is deliberate: `ProductDetailPanel` is a Client Component, and
  any prop handed to a Client Component gets serialized into the page's
  HTML/RSC payload for hydration — so it must never be mounted for an
  anonymous visitor, even if its own render logic would hide the internal
  fields. Anonymous requests get the plain server-rendered public view
  instead, which never receives wholesale cost, difficulty/enjoyment/
  preference, or favorite in the first place.
- `public/uploads/` — uploaded product photos (local filesystem storage).
  Not committed to git. For production, consider swapping `lib/uploads.ts`
  for cloud storage (S3, R2, etc.) so uploads survive redeploys.

## Public share link

There's no separate "public" route — the public view *is* the normal site,
served to anyone without a valid admin session cookie. Send buyers the same
homepage/category/product URLs you use yourself; they just won't see
internal fields or admin controls.

## Branding

The header currently renders a placeholder text wordmark
(`components/Logo.tsx`). Swap in the studio's real logo by adding an image
file at `public/logo.svg` (or `.png`) and replacing that component with an
`<Image>` element.

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
