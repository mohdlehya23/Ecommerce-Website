/**
 * Helper utilities for the application
 */

/**
 * Get the current site URL dynamically
 * Works for: Production, Preview Deployments, and Localhost
 */
export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Primary production URL
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Vercel's automatic URL for previews
    "http://localhost:3000/";

  // Ensure URL has https protocol (except localhost)
  url = url.startsWith("http") ? url : `https://${url}`;

  // Ensure URL ends with /
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
};

/**
 * Get the auth callback URL
 */
export const getAuthCallbackURL = () => {
  return `${getURL()}api/auth/callback`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

/**
 * Generate short ID from UUID
 */
export const shortId = (uuid: string): string => {
  return uuid.slice(0, 8).toUpperCase();
};
