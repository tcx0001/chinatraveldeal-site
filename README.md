# Chinatraveldeal - US to China Travel Website

This is a starter travel website for routes from the U.S. to China, including
Chinese culture experiences and food journey programs.

## Project structure

- `index.html` - deal-style landing page with secondary category nav, hero carousel, destination/month search strip, region tabs, image deal cards (duration/discount/original price/tags), recently viewed, pagination strip, testimonials, newsletter, booking form
- `styles.css` - responsive styles
- `script.js` - booking/newsletter interactions, hero carousel, region tab switching, data-driven deal rendering (loads `deals.json` config), category + search + month filtering, dynamic pagination
- `deals.json` - structured data source with `filters`, `destinations`, `payment`, and `deals`
- `admin.html` / `admin.js` / `admin.css` - visual deal + payment config builder with add/edit/delete, validation, duplicate title check, title search, keyword/category suggestions, local draft autosave/restore, and one-click `deals.json` download
- `vercel.json` - deployment defaults and security headers

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

## Next steps for production

- Connect a real backend for quote requests (Supabase/Firebase or custom API).
- Add email delivery (Resend or SendGrid) for form confirmations.
- Add analytics (GA4 + Search Console + Microsoft Clarity).
- Add legal pages: Privacy Policy, Terms, Cookie Notice.
- Add multilingual support if your audience includes non-English visitors.
