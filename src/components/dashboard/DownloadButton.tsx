"use client";

import { useState } from "react";

interface DownloadButtonProps {
  orderId: string;
  productId: string;
  productTitle: string;
  receiptToken?: string;
  className?: string;
}

export function DownloadButton({
  orderId,
  productId,
  productTitle,
  receiptToken,
  className = "btn-primary text-sm py-2 px-4 flex items-center gap-2",
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Navigate to download URL - the API will redirect to signed URL
      const url = new URL(`/api/downloads/${orderId}`, window.location.origin);
      url.searchParams.set("productId", productId);
      if (receiptToken) {
        url.searchParams.set("token", receiptToken);
      }
      window.location.href = url.toString();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      // Reset loading after a short delay since we're redirecting
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`${className} disabled:opacity-50`}
      title={`Download ${productTitle}`}
    >
      {isLoading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Preparing...
        </>
      ) : (
        <>
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </>
      )}
    </button>
  );
}
