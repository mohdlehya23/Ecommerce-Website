"use client";

import { useState } from "react";

interface ResendReceiptButtonProps {
  orderId: string;
  lastSentAt: string | null;
}

export function ResendReceiptButton({
  orderId,
  lastSentAt,
}: ResendReceiptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check cooldown (60 seconds)
  const cooldownMs = 60 * 1000;
  const lastSent = lastSentAt ? new Date(lastSentAt).getTime() : 0;
  const now = Date.now();
  const canResend = now - lastSent > cooldownMs;
  const cooldownRemaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/receipt/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend receipt");
      }

      setMessage({ type: "success", text: "Receipt sent to your email!" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to resend receipt",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleResend}
        disabled={isLoading || !canResend}
        className={`text-sm py-2 px-3 rounded-lg flex items-center gap-2 transition-colors ${
          canResend
            ? "text-accent hover:bg-accent/10"
            : "text-muted cursor-not-allowed"
        }`}
        title={
          !canResend
            ? `Wait ${cooldownRemaining}s to resend`
            : "Resend receipt email"
        }
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {isLoading ? "Sending..." : "Resend Receipt"}
      </button>

      {message && (
        <div
          className={`absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
