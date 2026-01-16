/**
 * Email Sending Utility with Resend Integration
 *
 * Features:
 * - Automatic logging to email_send_logs table
 * - Retry mechanism for failed emails
 * - Beautiful HTML templates
 * - Provider abstraction
 */

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// =====================================================
// TYPES
// =====================================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  referenceType?: "order" | "user" | "payout" | "verification";
  referenceId?: string;
}

export interface SendEmailResult {
  success: boolean;
  logId?: string;
  messageId?: string;
  error?: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONFIG = {
  // Default sender - change to your verified domain
  from: process.env.EMAIL_FROM || "Digital Store <onboarding@resend.dev>",

  // Enable/disable email sending (useful for development)
  enabled: process.env.RESEND_API_KEY ? true : false,
};

// =====================================================
// MAIN SEND FUNCTION
// =====================================================

export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const adminClient = createAdminClient();
  let logId: string | undefined;

  try {
    // 1. Log the email attempt
    const { data: logData, error: logError } = await adminClient.rpc(
      "log_email_send",
      {
        p_recipient: options.to,
        p_subject: options.subject,
        p_template: options.template || null,
        p_reference_type: options.referenceType || null,
        p_reference_id: options.referenceId || null,
        p_provider: "resend",
      }
    );

    if (logError) {
      console.error("[EMAIL] Failed to log email:", logError);
    } else {
      logId = logData as string;
    }

    // 2. Skip sending if not configured
    if (!EMAIL_CONFIG.enabled) {
      console.log("[EMAIL] Resend not configured - skipping send");
      console.log("[EMAIL] Would send to:", options.to);
      console.log("[EMAIL] Subject:", options.subject);

      if (logId) {
        await adminClient.rpc("mark_email_sent", {
          p_log_id: logId,
          p_provider_message_id: "mock-" + Date.now(),
        });
      }

      return { success: true, logId, messageId: "mock" };
    }

    // 3. Send via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);

      if (logId) {
        await adminClient.rpc("mark_email_failed", {
          p_log_id: logId,
          p_error_message: error.message,
          p_retry: true,
        });
      }

      return { success: false, logId, error: error.message };
    }

    // 4. Mark as sent
    if (logId) {
      await adminClient.rpc("mark_email_sent", {
        p_log_id: logId,
        p_provider_message_id: data?.id || null,
      });
    }

    console.log("[EMAIL] Sent successfully to:", options.to);
    return { success: true, logId, messageId: data?.id };
  } catch (error) {
    console.error("[EMAIL] Unexpected error:", error);

    if (logId) {
      await adminClient.rpc("mark_email_failed", {
        p_log_id: logId,
        p_error_message:
          error instanceof Error ? error.message : "Unknown error",
        p_retry: true,
      });
    }

    return {
      success: false,
      logId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// HTML EMAIL TEMPLATES
// =====================================================

const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
  .header { background: linear-gradient(90deg, #00d9ff 0%, #00ff88 100%); padding: 30px; text-align: center; }
  .header h1 { color: #1a1a2e; margin: 0; font-size: 28px; font-weight: 700; }
  .content { padding: 40px 30px; color: #e0e0e0; }
  .highlight-box { background: rgba(0, 217, 255, 0.1); border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
  .amount { font-size: 36px; font-weight: 700; color: #00ff88; margin: 10px 0; }
  .label { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .button { display: inline-block; background: linear-gradient(90deg, #00d9ff 0%, #00ff88 100%); color: #1a1a2e !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .footer { background: #0d0d1a; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .details-table td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .details-table td:first-child { color: #888; }
  .details-table td:last-child { text-align: right; color: #fff; }
`;

/**
 * Payout Confirmation Email Template
 */
export function payoutConfirmationTemplate(params: {
  sellerName: string;
  amount: number;
  paypalEmail: string;
  payoutId: string;
  dashboardUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>💸 Payout Sent!</h1>
    </div>
    <div class="content">
      <p>Hi ${params.sellerName},</p>
      <p>Great news! Your payout has been processed and sent to your PayPal account.</p>
      
      <div class="highlight-box">
        <div class="label">Amount Sent</div>
        <div class="amount">$${params.amount.toFixed(2)}</div>
        <div class="label" style="margin-top: 15px;">PayPal Account</div>
        <div style="color: #fff; font-size: 16px;">${params.paypalEmail}</div>
      </div>
      
      <table class="details-table">
        <tr>
          <td>Payout ID</td>
          <td><code style="color: #00d9ff;">${params.payoutId
            .slice(0, 8)
            .toUpperCase()}</code></td>
        </tr>
        <tr>
          <td>Processing Time</td>
          <td>Usually within 24 hours</td>
        </tr>
      </table>
      
      <p style="text-align: center;">
        <a href="${params.dashboardUrl}" class="button">View Dashboard</a>
      </p>
      
      <p style="color: #888; font-size: 14px;">
        If you have any questions about this payout, please contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Digital Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Order Receipt Email Template
 */
export function orderReceiptTemplate(params: {
  buyerName: string;
  orderShortId: string;
  items: Array<{ title: string; price: number }>;
  totalAmount: number;
  receiptUrl: string;
}): string {
  const itemsHtml = params.items
    .map(
      (item) => `
    <tr>
      <td style="color: #fff;">${item.title}</td>
      <td>$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi ${params.buyerName},</p>
      <p>Thank you for your purchase! Your order has been confirmed and your digital products are ready for download.</p>
      
      <div class="highlight-box">
        <div class="label">Order ID</div>
        <div style="color: #00d9ff; font-size: 24px; font-weight: 600;">#${
          params.orderShortId
        }</div>
      </div>
      
      <table class="details-table">
        ${itemsHtml}
        <tr style="border-top: 2px solid rgba(0,217,255,0.3);">
          <td style="font-weight: 600; color: #fff;">Total</td>
          <td style="font-size: 20px; color: #00ff88;">$${params.totalAmount.toFixed(
            2
          )}</td>
        </tr>
      </table>
      
      <p style="text-align: center;">
        <a href="${params.receiptUrl}" class="button">Download Your Products</a>
      </p>
      
      <p style="color: #888; font-size: 14px; text-align: center;">
        Your download links are valid for 1 hour. You can always access your purchases from your dashboard.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Digital Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * New Sale Notification Email Template (for Sellers)
 */
export function newSaleTemplate(params: {
  sellerName: string;
  productTitle: string;
  saleAmount: number;
  sellerEarnings: number;
  buyerName: string;
  dashboardUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎊 You Made a Sale!</h1>
    </div>
    <div class="content">
      <p>Hi ${params.sellerName},</p>
      <p>Great news! Someone just purchased your product.</p>
      
      <div class="highlight-box">
        <div class="label">Product Sold</div>
        <div style="color: #fff; font-size: 20px; margin: 10px 0;">${
          params.productTitle
        }</div>
        <div class="label" style="margin-top: 20px;">Your Earnings</div>
        <div class="amount">$${params.sellerEarnings.toFixed(2)}</div>
        <div style="color: #888; font-size: 12px;">(after 10% platform fee)</div>
      </div>
      
      <table class="details-table">
        <tr>
          <td>Sale Amount</td>
          <td>$${params.saleAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Buyer</td>
          <td>${params.buyerName}</td>
        </tr>
        <tr>
          <td>Status</td>
          <td><span style="color: #00d9ff;">In Escrow (14 days)</span></td>
        </tr>
      </table>
      
      <p style="color: #888; font-size: 14px;">
        Your earnings will be available for withdrawal after the 14-day escrow period.
      </p>
      
      <p style="text-align: center;">
        <a href="${params.dashboardUrl}" class="button">View Sales Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Digital Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Send payout confirmation email to seller
 */
export async function sendPayoutConfirmationEmail(params: {
  payoutId: string;
  sellerEmail: string;
  sellerName: string;
  amount: number;
  paypalEmail: string;
}): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return sendEmail({
    to: params.sellerEmail,
    subject: `💸 Payout of $${params.amount.toFixed(2)} Sent!`,
    html: payoutConfirmationTemplate({
      sellerName: params.sellerName,
      amount: params.amount,
      paypalEmail: params.paypalEmail,
      payoutId: params.payoutId,
      dashboardUrl: `${baseUrl}/seller/payouts`,
    }),
    template: "payout_confirmation",
    referenceType: "payout",
    referenceId: params.payoutId,
  });
}

/**
 * Send order receipt email to buyer
 */
export async function sendOrderReceiptEmail(params: {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  orderShortId: string;
  totalAmount: number;
  receiptUrl: string;
  items: Array<{ title: string; price: number }>;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: params.buyerEmail,
    subject: `🎉 Order #${params.orderShortId} Confirmed!`,
    html: orderReceiptTemplate({
      buyerName: params.buyerName,
      orderShortId: params.orderShortId,
      items: params.items,
      totalAmount: params.totalAmount,
      receiptUrl: params.receiptUrl,
    }),
    template: "order_receipt",
    referenceType: "order",
    referenceId: params.orderId,
  });
}

/**
 * Send new sale notification to seller
 */
export async function sendNewSaleEmail(params: {
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  productTitle: string;
  saleAmount: number;
  sellerEarnings: number;
  buyerName: string;
}): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return sendEmail({
    to: params.sellerEmail,
    subject: `🎊 New Sale: ${params.productTitle}`,
    html: newSaleTemplate({
      sellerName: params.sellerName,
      productTitle: params.productTitle,
      saleAmount: params.saleAmount,
      sellerEarnings: params.sellerEarnings,
      buyerName: params.buyerName,
      dashboardUrl: `${baseUrl}/seller/sales`,
    }),
    template: "new_sale",
    referenceType: "user",
    referenceId: params.sellerId,
  });
}

// =====================================================
// EMAIL VERIFICATION TEMPLATE & FUNCTION
// =====================================================

/**
 * Email Verification Template
 */
export function emailVerificationTemplate(params: {
  userName: string;
  verificationUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Welcome to Digital Store! Please verify your email address to complete your registration and access all features.</p>
      
      <div class="highlight-box">
        <div class="label">Click the button below to verify</div>
        <p style="color: #888; font-size: 14px; margin-top: 10px;">
          This link will expire in 24 hours
        </p>
      </div>
      
      <p style="text-align: center;">
        <a href="${params.verificationUrl}" class="button">Verify My Email</a>
      </p>
      
      <p style="color: #888; font-size: 14px;">
        If you didn't create an account with Digital Store, you can safely ignore this email.
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${
          params.verificationUrl
        }" style="color: #00d9ff; word-break: break-all;">${
    params.verificationUrl
  }</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Digital Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(params: {
  userId: string;
  userEmail: string;
  userName: string;
  verificationToken: string;
}): Promise<SendEmailResult> {
  const baseUrl =
    process?.env?.NEXT_PUBLIC_SITE_URL ||
    process?.env?.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000";

  // Ensure URL has https
  const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const verificationUrl = `${siteUrl}/api/auth/verify-email?token=${params.verificationToken}`;

  return sendEmail({
    to: params.userEmail,
    subject: "✉️ Verify your email - Digital Store",
    html: emailVerificationTemplate({
      userName: params.userName,
      verificationUrl,
    }),
    template: "email_verification",
    referenceType: "verification",
    referenceId: params.userId,
  });
}
