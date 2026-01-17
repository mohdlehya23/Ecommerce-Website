# 🚀 Digital Store Production Launch Checklist

This comprehensive guide covers PayPal configuration, Supabase security hardening, email deliverability, and production testing requirements.

---

## 📋 Table of Contents

1. [Environment Variables](#1️⃣-environment-variables)
2. [PayPal Configuration](#2️⃣-paypal-configuration)
3. [Database Security](#3️⃣-database-security-supabase)
4. [Email Setup](#4️⃣-email-setup-resend)
5. [Cron Jobs](#5️⃣-cron-jobs-setup)
6. [Security Checklist](#6️⃣-security-checklist)
7. [Production Tests](#7️⃣-production-readiness-tests)
8. [Monitoring](#8️⃣-monitoring--alerting)
9. [Troubleshooting](#9️⃣-troubleshooting)

---

## 1️⃣ Environment Variables

Create a `.env.local` (or `.env.production`) file with all required variables:

| Variable                        | Development             | Production Notes                             |
| ------------------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase URL            | Same for dev/prod                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key                | Same for dev/prod                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key        | ⚠️ **Keep secret!** Never expose client-side |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`  | Sandbox ID              | 🔄 **Switch to LIVE Client ID**              |
| `PAYPAL_CLIENT_ID`              | Sandbox ID              | 🔄 **Switch to LIVE Client ID**              |
| `PAYPAL_CLIENT_SECRET`          | Sandbox secret          | 🔄 **Switch to LIVE Secret**                 |
| `PAYPAL_MODE`                   | `sandbox`               | 🔄 **Change to `live`**                      |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3000` | 🔄 **Change to production URL**              |
| `CRON_SECRET`                   | Random string           | Generate new secure secret                   |
| `PAYPAL_WEBHOOK_ID`             | Sandbox webhook         | 🔄 **Create new LIVE webhook**               |
| `PAYPAL_CHECKOUT_WEBHOOK_ID`    | Sandbox webhook         | 🔄 **Create new LIVE webhook**               |
| `RESEND_API_KEY`                | Resend API key          | Required for custom emails                   |
| `EMAIL_FROM`                    | Sender email            | e.g., `Store <no-reply@yourdomain.com>`      |

### Generate Secure CRON_SECRET

```bash
openssl rand -base64 32
```

---

## 2️⃣ PayPal Configuration

### Checkout Webhook Events

| Event                       | Description                      |
| --------------------------- | -------------------------------- |
| `CHECKOUT.ORDER.APPROVED`   | Order approved                   |
| `PAYMENT.CAPTURE.COMPLETED` | Payment completed                |
| `PAYMENT.CAPTURE.DENIED`    | Payment denied                   |
| `PAYMENT.CAPTURE.PENDING`   | Payment pending                  |
| `PAYMENT.CAPTURE.REFUNDED`  | Payment refunded ⭐ **Critical** |
| `PAYMENT.CAPTURE.REVERSED`  | Payment reversed ⭐ **Critical** |

> [!CAUTION]
> **REFUNDED and REVERSED events are essential!** When a customer receives a refund, the webhook must update order status and prevent new download links.

### Payouts Webhook Events

| Event                            | Description                 |
| -------------------------------- | --------------------------- |
| `PAYMENT.PAYOUTSBATCH.SUCCESS`   | Payout batch succeeded      |
| `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` | Individual payout succeeded |
| `PAYMENT.PAYOUTS-ITEM.FAILED`    | Individual payout failed    |
| `PAYMENT.PAYOUTSBATCH.DENIED`    | Payout batch denied         |

### Setup Steps

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Create a **Live Application** (not Sandbox)
3. Copy the **Live Client ID** and **Secret**
4. Add Webhook URLs:
   - Checkout: `https://yourdomain.com/api/paypal/checkout-webhook`
   - Payouts: `https://yourdomain.com/api/payouts/paypal-webhook`
5. Subscribe to all events listed above
6. Copy Webhook IDs to environment variables

---

## 3️⃣ Database Security (Supabase)

### Security & Network

| Setting                  | Description                                  | Status |
| ------------------------ | -------------------------------------------- | ------ |
| **SSL Enforcement**      | Enable SSL for Postgres connections          | ☐      |
| **Network Restrictions** | Restrict access to specific IPs (Vercel)     | ☐      |
| **MFA for Admins**       | Enable two-factor auth for Supabase accounts | ☐      |
| **RLS Enabled**          | Row Level Security on all tables             | ☐      |

### Backups & Recovery

| Setting              | Description                                       | Status |
| -------------------- | ------------------------------------------------- | ------ |
| **Daily Backups**    | Confirm backups are enabled                       | ☐      |
| **Retention Period** | Understand backup retention duration              | ☐      |
| **PITR**             | Point-in-Time Recovery for second-level precision | ☐      |

### Supabase Setup Steps

1. Run all migrations in order (001 through 018)
2. Create Storage Buckets:
   - `downloads` (private - for digital products)
   - `product-images` (public - for thumbnails)
   - `avatars` (public - for profile pictures)
3. Add first admin user:
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('<your-user-id>');
   ```
4. Add production URL to Allowed Redirect URLs (Auth settings)

---

## 4️⃣ Email Setup (Resend)

The platform uses Resend for custom branded transactional emails.

### Email Types

| Email Type          | Template                     | Trigger                |
| ------------------- | ---------------------------- | ---------------------- |
| Email Verification  | `emailVerificationTemplate`  | User registration      |
| Password Reset      | `passwordResetTemplate`      | Forgot password        |
| Order Receipt       | `orderReceiptTemplate`       | Successful purchase    |
| New Sale            | `newSaleTemplate`            | Seller receives a sale |
| Payout Confirmation | `payoutConfirmationTemplate` | Admin processes payout |

### Setup Steps

1. Create account at [resend.com](https://resend.com)
2. Get API key and add to `RESEND_API_KEY`
3. Verify your domain for best deliverability

### Domain Authentication (SPF/DKIM/DMARC)

Add these DNS records:

```dns
# SPF Record
TXT  @  "v=spf1 include:amazonses.com ~all"

# DKIM Record (get from Resend dashboard)
TXT  resend._domainkey  "v=DKIM1; k=rsa; p=..."

# DMARC Record
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

> [!TIP]
> Use [mail-tester.com](https://mail-tester.com) to verify your email configuration.

---

## 5️⃣ Cron Jobs Setup

The platform requires scheduled tasks for escrow release.

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/release-escrow",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Manual Cron Test

```bash
curl -X POST https://yourdomain.com/api/cron/release-escrow \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 6️⃣ Security Checklist

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| All environment variables set in hosting platform      | ☐      |
| `.env.local` in `.gitignore`                           | ☐      |
| `SUPABASE_SERVICE_ROLE_KEY` only used server-side      | ☐      |
| PayPal credentials from **Live** account (not Sandbox) | ☐      |
| `CRON_SECRET` is a strong random value                 | ☐      |
| RLS enabled on all Supabase tables                     | ☐      |
| Admin user added to `admin_users` table                | ☐      |
| SSL enabled on domain                                  | ☐      |
| Webhooks working correctly                             | ☐      |
| Resend API key configured                              | ☐      |
| Email domain authenticated (SPF/DKIM)                  | ☐      |

---

## 7️⃣ Production Readiness Tests

> [!WARNING]
> **Do not open the site to the public before verifying these tests!**

### 🛡️ Refund Test (Critical)

| Step                                                         | Status |
| ------------------------------------------------------------ | ------ |
| Make a real purchase (small amount)                          | ☐      |
| Issue refund from PayPal Dashboard                           | ☐      |
| Verify `PAYMENT.CAPTURE.REFUNDED` event received             | ☐      |
| Verify order status changed to `refunded`                    | ☐      |
| **Critical:** Verify site refuses to issue new download link | ☐      |

### 📧 Email Tests

| Test                                        | Status |
| ------------------------------------------- | ------ |
| Registration → Verification email received  | ☐      |
| Forgot password → Reset email received      | ☐      |
| Purchase → Receipt email received           | ☐      |
| Payout → Seller notification email received | ☐      |
| Emails not landing in spam                  | ☐      |

### 👤 User Tests

| Test                         | Status |
| ---------------------------- | ------ |
| Register new user            | ☐      |
| Verify email                 | ☐      |
| Login                        | ☐      |
| Reset password               | ☐      |
| Browse products              | ☐      |
| Add to cart                  | ☐      |
| Add multiple quantities      | ☐      |
| Complete PayPal checkout     | ☐      |
| Download files (Signed URLs) | ☐      |
| View invoice                 | ☐      |

### 🏪 Seller Tests

| Test                         | Status |
| ---------------------------- | ------ |
| Apply as seller              | ☐      |
| Create new product           | ☐      |
| Edit/Delete product          | ☐      |
| Review sales                 | ☐      |
| Request payout (minimum $10) | ☐      |

### 🔧 Admin Tests

| Test                             | Status |
| -------------------------------- | ------ |
| Access admin dashboard           | ☐      |
| Manage sellers (approve/suspend) | ☐      |
| Process payout requests          | ☐      |
| Review audit logs                | ☐      |

### ⏰ Cron Tests

| Test                               | Status |
| ---------------------------------- | ------ |
| Cron executes daily                | ☐      |
| Escrow released after 14 days      | ☐      |
| Seller `available_balance` updated | ☐      |

---

## 8️⃣ Monitoring & Alerting

> [!CAUTION]
> Without monitoring, webhooks may stop working and money could be lost!

### Recommended Tools

| Tool                 | Function                    |
| -------------------- | --------------------------- |
| **Sentry**           | Real-time error tracking    |
| **UptimeRobot**      | API availability monitoring |
| **Vercel Analytics** | Performance analytics       |

### Critical APIs to Monitor

```
/api/paypal/*
/api/payouts/*
/api/cron/*
/api/downloads/*
/api/auth/*
```

### Required Alerts

- ☐ Immediate alert on Webhook failure
- ☐ Alert on Cron Job failure
- ☐ Alert on high error rate
- ☐ Alert on email delivery failures

---

## 9️⃣ Troubleshooting

### PayPal Payments Not Working

1. Verify `PAYPAL_MODE=live`
2. Verify Client ID and Secret are from Live app
3. Verify Webhook URLs are correct and reachable
4. Review PayPal Dashboard for failed webhooks

### Downloads Not Working

1. Verify `downloads` storage bucket exists
2. Verify file paths are correct in database
3. Check Supabase storage policies
4. Verify `payment_status = completed`

### Payouts Failing

1. Ensure seller has configured PayPal payout email
2. Verify PayPal Payouts API is enabled on your account
3. Check available balance is sufficient
4. Review admin logs for error messages

### Emails Not Delivered

1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for delivery status
3. Verify SPF/DKIM records are correct
4. Use [mail-tester.com](https://mail-tester.com) to diagnose

### Password Reset Not Working

1. Verify Resend API key is valid
2. Check `NEXT_PUBLIC_SITE_URL` is correct
3. Verify user exists in auth.users
4. Check email_send_logs for errors

### Order Items Missing

If seller earnings are incorrect:

1. Check `order_items` table has correct number of rows
2. Verify each quantity unit has separate row
3. Run `fulfill_order_from_webhook` RPC manually if needed

---

## 📝 Quick Reference

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Test Cron Endpoint
curl -X POST https://yourdomain.com/api/cron/release-escrow \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check Live Mode
# Checkout button should NOT show "Sandbox" watermark in production
```

---

**Last Updated:** January 2026
