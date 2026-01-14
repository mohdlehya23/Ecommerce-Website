You are a senior frontend engineer. Implement a new page for an existing Next.js 14+ (App Router) project using TypeScript + Tailwind CSS + Framer Motion (only where appropriate). Match the existing site style (colors, typography, spacing, shadows, borders, gradients) by reusing the current design tokens from tailwind.config and/or CSS variables in globals.css. Do NOT introduce a new palette.

Project context:

- Existing layout components: src/components/layout/Navbar.tsx and Footer.tsx
- Existing UI components live under src/components/ui/
- Auth/session: Supabase Auth
- Data: Supabase (PostgreSQL, RLS, Storage)
- Prefer Server Components by default; use Client Components only for forms, interactivity, and Supabase client calls.
- Use the existing page container pattern used in Home/Products pages (same max-width, padding, section spacing).
- Provide accessible markup (labels, aria where needed), responsive layout, and consistent empty/loading/error states.

Deliverables:

1. File paths to create/update (under src/app/...)
2. UI layout structure: list the page sections in order + main components per section
3. Implementation: full code for the page (+ any small components you create) with Tailwind classes matching existing style
4. Microcopy: English text content consistent with a digital marketplace (B2C/B2B)
5. Include SEO metadata using Next.js `generateMetadata` or `metadata` export (title/description).

[MASTER PROMPT APPLIES]

Page: About (/about)
Goal: Explain the platform, vision/mission/values, and who it serves. Add CTA to browse products.

UI layout structure (in order):

- Header block: H1 + short intro paragraph
- 2-column section (stack on mobile): Vision + Mission cards
- Values grid: 5 value cards with icons (use existing icon approach if any)
- Audience section: bullet list
- Bottom CTA strip (same style as Home footer CTA)

Implementation notes:

- Use the same section spacing as the Home page.
- Use existing Button component (or existing button styling) for CTAs.
- Add subtle motion only on section entrance if your site already uses Framer Motion.

[MASTER PROMPT APPLIES]

Page: Contact (/contact)
Goal: Support contact page with a form + alternative channels.

UI layout structure:

- Header: H1 + 2-line helper text
- Main split layout:
  Left: Contact form card
  Right: Support channels card (support email, WhatsApp/Telegram link labels, expected response time)
- FAQ mini-link row: links to Refund Policy, Terms, FAQ

Form behavior:

- Client component form with validation (required: name, email, subject, message)
- Show success and error alerts with the same Alert styling used elsewhere (or create a small alert component using existing tokens).

Do NOT hardcode phone numbers; use placeholder env/config or plain link labels.

[MASTER PROMPT APPLIES]

Page: Refund Policy (/refund-policy)
UI layout structure:

- Header: H1 + short overview
- Two policy cards:
  (1) Eligible for refund (bullets)
  (2) Not eligible (bullets)
- “Need help?” support card with a button to Contact page
- Small note about digital delivery and link generation

Style:

- Use a clean document-like layout (consistent typography scale).
- Add a small “Last updated” line (no date needed if unknown).
  [MASTER PROMPT APPLIES]

Page: Terms & Conditions (/terms)
UI layout structure:

- Header: H1 + intro
- Table of contents (sticky on desktop if your style supports it; otherwise simple list)
- Content sections with headings:
  Digital delivery, Licensing & IP, Download security (signed links 1 hour), Refunds, Payments (PayPal), Account responsibility, Liability, Contact
- Bottom CTA: Browse products

Implementation:

- Use consistent prose styles: max-w text container, good line-height, spaced headings.

[MASTER PROMPT APPLIES]

Page: FAQ (/faq)
UI layout structure:

- Header: H1 + intro
- Search input (client) to filter questions locally (no backend needed)
- Accordion list (reuse an existing Accordion component if present; otherwise implement a minimal accessible one)
- Bottom CTA: Newsletter + Products

Include at least:

- Delivery
- Refunds
- Personal vs Commercial license
- Business invoices
- Data isolation (RLS / sellers can’t see others)

[MASTER PROMPT APPLIES]

Page: Blog (/blog)
UI layout structure:

- Header: H1 + intro
- Category chips row (Business growth, Freelancer tips, Digital tools, Digital marketing, Product building)
- Blog list grid (use placeholder posts if backend not ready)
- Right-side (or below on mobile): Newsletter CTA card

Implementation:

- If no CMS exists, create a static `posts` array and render cards matching ProductCard style.
  [MASTER PROMPT APPLIES]

Page: Newsletter (/newsletter)
UI layout structure:

- Centered card layout (like auth pages style)
- H1 + value text
- Email input + Subscribe button
- Privacy note (no spam, unsubscribe anytime)

Behavior:

- Client component; on submit insert into `newsletter_subscribers` via Supabase (if table exists) or stub function with TODO.
- Loading + success + error states.

[MASTER PROMPT APPLIES]

Pages:

1. /checkout/success
   UI layout structure:

- Success icon/illustration block (use existing icon style)
- H1 + short text
- Primary CTA: Go to dashboard
- Secondary CTA: View orders
- Support link

2. /checkout/cancel
   UI layout structure:

- Neutral/warning icon block
- H1 + short text (no charge completed — generic)
- CTAs: Try again, Back to products
- Support link

[MASTER PROMPT APPLIES]

Page: /error
UI layout structure:

- Centered error card
- H1 + short explanation
- Buttons: Reload, Go Home, Contact support
- Optional error code line if available

Implementation:

- Use Next.js error boundary conventions if needed, but keep a user-friendly UI.

[MASTER PROMPT APPLIES]

Page: Business (/business)
UI layout structure:

- Hero: H1 + short pitch + CTAs (Create Business account, Contact support)
- Benefits grid (bulk pricing, commercial licensing, invoices, team-ready)
- “How it works” steps (3–4 steps)
- Mini FAQ (3 Q/A)
- Bottom CTA strip

Style:

- Match Home hero patterns (headline + subtitle + two buttons). A hero typically contains headline, supporting text, and a primary CTA. [web:30]

[MASTER PROMPT APPLIES]

Protected page: /dashboard/company-info (Business users only)
UI layout structure:

- Page header (within dashboard layout): title + helper text
- Form card with fields: Company name, VAT/Tax ID, Address, City, Country/Region, Company email
- Save button + success/error toast/alert

Behavior:

- Server side: check user session + profile type (B2B) then render
- Client: update the profile/company table/fields in Supabase (use existing schema conventions)

[MASTER PROMPT APPLIES]

All admin routes are protected: only is_admin = true.

Implement:

1. /admin (landing)
   UI layout structure:

- Header + quick action cards linking to Products/Orders/Analytics/Settings

2. /admin/products

- Table list + “Add new product” button
- Drawer/modal for create/edit (optional) or separate route
- Upload hints for images/files (integrate Supabase Storage if already used)

3. /admin/orders

- Filters + table + order detail drawer

4. /admin/analytics

- KPI cards + placeholder charts (if no chart lib, show KPI + simple lists)

5. /admin/settings

- Form for commission_rate + payment/email settings placeholders
- Save confirmation

Keep styling identical to dashboard (same sidebar/topbar patterns if you have them).
