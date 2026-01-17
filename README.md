# Digital Store - Multi-Seller E-commerce Platform

A modern, production-ready e-commerce marketplace for selling digital products and services. Features multi-seller support, admin panel, PayPal payments, and automated seller payouts.

## 🚀 Tech Stack

| Category     | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **Backend**  | Supabase (PostgreSQL, Auth, Storage, RLS)                         |
| **Payments** | PayPal Checkout & PayPal Payouts API                              |
| **Email**    | Resend (custom branded emails)                                    |
| **State**    | Zustand (cart with localStorage persistence)                      |

## ✨ Features

### For Buyers

- 🔐 Email/Password & Google OAuth authentication
- ✉️ Email verification with custom branded emails
- 🔑 Password reset via custom Resend templates
- 🛍️ Browse products by category (E-books, Templates, Consulting)
- 💳 Secure PayPal checkout
- 📦 Dashboard with order history & secure downloads
- 🧾 Printable invoices with B2B company details
- 👤 B2C/B2B account types with dynamic pricing

### For Sellers

- 🏪 Apply to become a seller (instant approval)
- 📝 Create and manage digital products
- 🎨 Customizable public store page (`/creators/[username]`)
- 💰 Track sales and earnings with 14-day escrow
- 💸 Request PayPal payouts (90% seller / 10% platform fee)
- ⚙️ Configure payout email settings

### For Admins

- 📊 Platform dashboard with KPIs
- 👥 Manage sellers (approve/suspend)
- 📦 View all products and orders
- 💳 Process payout requests via PayPal Payouts API
- 📈 Analytics with top sellers & products
- ⚙️ Admin management (add/remove admins)
- 📋 Full audit logging

## 🔄 Payout System

The platform implements a robust automated payout system:

```
Customer Purchase
    ↓
Seller Earnings Recorded (14-day escrow)
    ↓
Funds Released to Available Balance (daily cron)
    ↓
Seller Requests Payout (min $10)
    ↓
Admin Approves via PayPal Payouts API
    ↓
PayPal Webhook Confirms → Status = Completed
```

### Key Tables:

- `seller_earnings` - Tracks each sale with escrow status
- `payout_requests` - Withdrawal request queue
- `sellers.available_balance` / `pending_balance` / `total_earnings`

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/               # Login, Register, Password Reset
│   ├── admin/                # Admin panel
│   │   ├── products/
│   │   ├── orders/
│   │   ├── sellers/
│   │   ├── payouts/          # Payout management
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/
│   │   ├── admin/            # Admin APIs
│   │   ├── auth/             # Email verification, Password Reset
│   │   ├── payouts/          # Payout processing
│   │   │   ├── request/      # Seller requests payout
│   │   │   ├── process/      # Admin processes via PayPal
│   │   │   └── paypal-webhook/
│   │   ├── cron/             # Scheduled tasks
│   │   │   └── release-escrow/
│   │   ├── paypal/           # PayPal checkout
│   │   ├── downloads/        # Secure file downloads
│   │   └── invoice/          # Invoice generation
│   ├── checkout/
│   ├── creators/[username]/  # Public seller stores
│   ├── dashboard/            # User dashboard
│   ├── products/             # Product catalog
│   └── seller/               # Seller dashboard
│       ├── products/         # Product management
│       ├── payouts/          # Earnings & withdrawals
│       ├── payout-settings/  # PayPal email config
│       └── store/            # Store customization
├── components/
│   ├── admin/                # Admin UI components
│   ├── cart/                 # Cart drawer & items
│   ├── layout/               # Navbar, Footer, LayoutWrapper
│   └── products/             # Product cards & filters
├── lib/
│   ├── supabase/             # Supabase clients (client, server, admin)
│   ├── email.ts              # Resend email utility & templates
│   └── admin.ts              # Admin utilities
└── stores/
    └── cartStore.ts          # Zustand cart
```

## 🗄️ Database Schema

| Table                       | Description                          |
| --------------------------- | ------------------------------------ |
| `profiles`                  | User profiles (B2B/B2C)              |
| `sellers`                   | Seller accounts with balance         |
| `products`                  | Product catalog with dual pricing    |
| `orders`                    | Order records                        |
| `order_items`               | Items per order with seller tracking |
| `seller_earnings`           | Sale earnings with escrow            |
| `payout_requests`           | Seller withdrawal requests           |
| `store_pages`               | Custom seller store pages            |
| `admin_users`               | Platform administrators              |
| `admin_audit_logs`          | Admin action audit trail             |
| `email_verification_tokens` | Custom email verification            |
| `email_send_logs`           | Email delivery tracking              |

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

**Required:**

| Variable                        | Description               |
| ------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`  | PayPal client ID          |
| `PAYPAL_CLIENT_SECRET`          | PayPal client secret      |
| `PAYPAL_MODE`                   | `sandbox` or `live`       |
| `CRON_SECRET`                   | Secret for cron job auth  |
| `RESEND_API_KEY`                | Resend API key for emails |
| `EMAIL_FROM`                    | Sender email address      |

### 3. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations in order (001 through 018)
3. Create storage buckets: `downloads`, `avatars`, `product-images`
4. Add yourself as first admin:
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('your-user-id');
   ```

### 4. Configure PayPal Webhooks

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox)
2. Add webhook URLs:
   - Checkout: `https://yourdomain.com/api/paypal/checkout-webhook`
   - Payouts: `https://yourdomain.com/api/payouts/paypal-webhook`
3. Subscribe to required events (see PRODUCTION_CHECKLIST.md)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Dedicated `admin_users` table (not profile roles)
- `is_admin()` SECURITY DEFINER function
- Server-side payment verification
- Signed URLs with 1-hour expiration
- Full admin action audit logging
- Last-admin deletion protection
- 14-day escrow on seller earnings
- Atomic database transactions for payouts
- Custom password reset with single-use tokens

## 📖 Recent Updates

### January 2026

- ✅ Implemented forgot password flow with custom Resend emails
- ✅ Fixed order items quantity bug (multiple units now recorded correctly)
- ✅ Fixed seller earnings calculation for multi-quantity orders
- ✅ Enhanced password validation (8+ chars, number, special char)
- ✅ Added password reset email template
- ✅ Fixed fulfill_order_from_webhook RPC column collision
- ✅ Implemented email verification with custom tokens
- ✅ Implemented automated seller payout system
- ✅ Added 14-day escrow for seller earnings
- ✅ Created PayPal Payouts API integration

## 📚 Additional Documentation

- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Detailed production deployment guide

## 📄 License

MIT
