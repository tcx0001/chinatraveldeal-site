# Chinatraveldeal - US to China Travel Website

This is a starter travel website for routes from the U.S. to China, including
Chinese culture experiences and food journey programs.

## Project structure

- `index.html` - deal-style landing page with secondary category nav, hero carousel, destination/month search strip, region tabs, image deal cards (duration/discount/original price/tags), recently viewed, pagination strip, testimonials, newsletter, booking form
- `styles.css` - responsive styles
- `script.js` - booking/newsletter interactions, hero carousel, region tab switching, data-driven deal rendering (loads `deals.json` config), category + search + month filtering, dynamic pagination
- `deals.json` - structured data source with `filters`, `destinations`, `payment`, and `deals`
- `admin.html` / `admin.js` / `admin.css` - visual deal + payment config builder with add/edit/delete, validation, duplicate title check, title search, keyword/category suggestions, local draft autosave/restore, and one-click `deals.json` download
- `robots.txt` / `sitemap.xml` - search engine crawling and indexing files for GitHub Pages
- `vercel.json` - deployment defaults and security headers
- `supabase/sql/001_create_lead_requests.sql` - booking/newsletter lead table
- `supabase/functions/lead-intake/index.ts` - lead API (DB insert + Resend email)

## Online payment status

- A payment entry section is live on the homepage.
- Real payment gateway is not connected yet.
- Set `payment.depositUrl` and `payment.fullUrl` in `deals.json` (or via `admin.html`)
  to enable direct online checkout.

## Deploy to U.S. audience (Vercel recommended)

1. Create a GitHub repository and upload all files.
2. In Vercel, import the repository.
3. Keep Framework Preset as `Other` (static site).
4. In project settings, select a U.S. region for serverless functions if you add APIs later.
5. Add your custom `.com` domain and enable HTTPS.
6. Publish.

## Local preview note

Because the page fetches `deals.json`, preview with a local web server instead of opening
`index.html` directly from file explorer.

## Booking backend (Supabase + Resend)

The frontend form now supports a real backend. It posts to URLs in `deals.json`:

```json
"backend": {
  "bookingEndpoint": "https://<project-ref>.supabase.co/functions/v1/lead-intake",
  "newsletterEndpoint": "https://<project-ref>.supabase.co/functions/v1/lead-intake"
}
```

### 1) Create DB table

In Supabase SQL Editor, run:

`supabase/sql/001_create_lead_requests.sql`

### 2) Deploy the Edge Function

From project root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set PROJECT_URL="https://<your-project-ref>.supabase.co" SERVICE_ROLE_KEY="<service-role-or-sb-secret-key>" RESEND_API_KEY="<re_xxx>" LEAD_NOTIFY_TO="275364182@qq.com" LEAD_FROM_EMAIL="Chinatraveldeal <onboarding@resend.dev>"
supabase functions deploy lead-intake --no-verify-jwt
```

Use non-reserved secret names (`PROJECT_URL`, `SERVICE_ROLE_KEY`) because `SUPABASE_*` is reserved in the CLI.

### 3) Fill endpoint in deals.json

Set both endpoints to your deployed function URL:

`https://<project-ref>.supabase.co/functions/v1/lead-intake`

### 4) Redeploy static site

Commit and push to GitHub Pages after updating `deals.json`.

## Notes

- `bookingForm` and `newsletterForm` now require backend endpoints to actually submit.
- If endpoints are empty, the site will show "backend not connected yet."
