# 🚀 Digital Store Production Launch Checklist

This comprehensive guide covers PayPal configuration, Supabase security hardening, email deliverability, and production testing requirements.

---

## 📋 Table of Contents

1. [Environment Variables](#1️⃣-environment-variables)
2. [PayPal Advanced Configuration](#2️⃣-paypal-advanced-configuration-live-webhooks)
3. [Database Security Hardening](#3️⃣-database-security-hardening-supabase)
4. [Transactional Emails](#4️⃣-transactional-emails--deliverability)
5. [Cron Jobs Setup](#5️⃣-cron-jobs-setup)
6. [Security Checklist](#6️⃣-security-checklist)
7. [Production Readiness Tests](#7️⃣-production-readiness-tests)
8. [Monitoring & Alerting](#8️⃣-monitoring--alerting)
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
| `PAYPAL_SECRET`                 | Sandbox secret          | 🔄 **Switch to LIVE Secret**                 |
| `PAYPAL_MODE`                   | `sandbox`               | 🔄 **Change to `live`**                      |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3000` | 🔄 **Change to production URL**              |
| `CRON_SECRET`                   | Random string           | Generate new secure secret                   |
| `PAYPAL_WEBHOOK_ID`             | Sandbox webhook         | 🔄 **Create new LIVE webhook**               |
| `PAYPAL_CHECKOUT_WEBHOOK_ID`    | Sandbox webhook         | 🔄 **Create new LIVE webhook**               |

### Generate Secure CRON_SECRET

```bash
openssl rand -base64 32
```

---

## 2️⃣ PayPal Advanced Configuration (Live Webhooks)

When switching to Live environment, subscribe to these events for proper refund and dispute handling.

### ✅ Recommended Checkout Webhook Events

| Event                       | Description                      |
| --------------------------- | -------------------------------- |
| `CHECKOUT.ORDER.APPROVED`   | Order approved                   |
| `PAYMENT.CAPTURE.COMPLETED` | Payment completed                |
| `PAYMENT.CAPTURE.DENIED`    | Payment denied                   |
| `PAYMENT.CAPTURE.PENDING`   | Payment pending ⭐ **New**       |
| `PAYMENT.CAPTURE.REFUNDED`  | Payment refunded ⭐ **Critical** |
| `PAYMENT.CAPTURE.REVERSED`  | Payment reversed ⭐ **Critical** |

> [!CAUTION] > **REFUNDED and REVERSED events are essential!**  
> When a customer receives a refund, the webhook must update `order.payment_status` and prevent new download links (Signed URLs) from being issued.

### ✅ Payouts Webhook Events

| Event                            | Description                 |
| -------------------------------- | --------------------------- |
| `PAYMENT.PAYOUTSBATCH.SUCCESS`   | Payout batch succeeded      |
| `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` | Individual payout succeeded |
| `PAYMENT.PAYOUTS-ITEM.FAILED`    | Individual payout failed    |
| `PAYMENT.PAYOUTSBATCH.DENIED`    | Payout batch denied         |

### Setup Steps for Live Webhooks

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Create a **Live Application** (not Sandbox)
3. Copy the **Live Client ID** and **Secret**
4. Add Webhook URLs:
   - Checkout: `https://yourdomain.com/api/paypal/checkout-webhook`
   - Payouts: `https://yourdomain.com/api/payouts/paypal-webhook`
5. Subscribe to all events listed above
6. Copy Webhook IDs to environment variables

---

## 3️⃣ Database Security Hardening (Supabase)

Supabase strongly recommends applying these standards before going public.

### ✅ Security & Network

| Setting                  | Description                                  | Status |
| ------------------------ | -------------------------------------------- | ------ |
| **SSL Enforcement**      | Enable SSL for Postgres connections          | ☐      |
| **Network Restrictions** | Restrict access to specific IPs (Vercel)     | ☐      |
| **MFA for Admins**       | Enable two-factor auth for Supabase accounts | ☐      |
| **RLS Enabled**          | Row Level Security on all tables             | ☐      |

### ✅ Backups & Recovery

| Setting              | Description                                       | Status |
| -------------------- | ------------------------------------------------- | ------ |
| **Daily Backups**    | Confirm backups are enabled                       | ☐      |
| **Retention Period** | Understand backup retention duration              | ☐      |
| **PITR**             | Point-in-Time Recovery for second-level precision | ☐      |

### ✅ Supabase Production Setup

1. Run all migrations in order (001 through 016)
2. Create Storage Buckets:
   - `downloads` (private - for digital products)
   - `product-images` (public - for thumbnails)
   - `avatars` (public - for profile pictures)
3. Add first admin user:
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('<your-user-id>');
   ```
4. Add production URL to Allowed Redirect URLs

---

## 4️⃣ Transactional Emails & Deliverability

> [!IMPORTANT]
> Default Supabase email settings are **not sufficient** for production!

### ✅ Setup Steps

#### 1. Choose SMTP Provider

| Provider     | Features                                |
| ------------ | --------------------------------------- |
| **Resend**   | Easy, modern API, excellent integration |
| **SendGrid** | Reliable, advanced analytics            |
| **AWS SES**  | Cheapest for high volume                |

#### 2. Configure SMTP in Supabase

1. Go to: **Authentication → SMTP Settings**
2. Enter: Host, Port, User, Password
3. Use official email: `no-reply@yourdomain.com`

#### 3. Domain Authentication (SPF/DKIM/DMARC)

Add these records to your domain's DNS:

```dns
# SPF Record
TXT  @  "v=spf1 include:_spf.yourmailprovider.com ~all"

# DKIM Record (get from email provider)
TXT  resend._domainkey  "v=DKIM1; k=rsa; p=..."

# DMARC Record
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

> [!TIP] > **Goal:** Prevent invoices and verification emails from landing in Spam folder

#### 4. Email Send Logging (Optional)

The platform includes an `email_send_logs` table for tracking failures and retries.

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

---

## 7️⃣ Production Readiness Tests

> [!WARNING] > **Do not open the site to the public before verifying these tests on the Live environment!**

### 🛡️ Refund Test (Critical)

| Step                                                         | Status |
| ------------------------------------------------------------ | ------ |
| Make a real purchase (small amount)                          | ☐      |
| Issue refund from PayPal Dashboard                           | ☐      |
| Verify `PAYMENT.CAPTURE.REFUNDED` event received             | ☐      |
| Verify order status changed to `refunded`                    | ☐      |
| **Critical:** Verify site refuses to issue new download link | ☐      |

### 📧 Email Deliverability Test

| Test                                        | Status |
| ------------------------------------------- | ------ |
| Registration → Verification email received  | ☐      |
| Purchase → Invoice email received           | ☐      |
| Payout → Seller notification email received | ☐      |
| Gmail "Show original" → SPF=PASS            | ☐      |
| Gmail "Show original" → DKIM=PASS           | ☐      |

### 👤 User Tests

| Test                         | Status |
| ---------------------------- | ------ |
| Register new user            | ☐      |
| Login                        | ☐      |
| Browse products              | ☐      |
| Add to cart                  | ☐      |
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
> Without monitoring, webhooks may stop working and money could be lost without your knowledge!

### Recommended Setup

| Tool                 | Function                    |
| -------------------- | --------------------------- |
| **Sentry**           | Real-time error tracking    |
| **UptimeRobot**      | API availability monitoring |
| **Vercel Analytics** | Performance analytics       |

### Sensitive APIs to Monitor

```
/api/paypal/*
/api/payouts/*
/api/cron/*
/api/downloads/*
```

### Required Alerts

- ☐ Immediate alert on Webhook failure
- ☐ Alert on Cron Job failure
- ☐ Alert on high error rate

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

### Emails Landing in Spam

1. Verify SPF Record is set up
2. Verify DKIM Record is set up
3. Verify DMARC Record is set up
4. Use [mail-tester.com](https://mail-tester.com) to check

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
