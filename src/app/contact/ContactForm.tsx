"use client";

import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      // TODO: Implement actual form submission (e.g., to Supabase or email service)
      // For now, simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Alert */}
      {status === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Message sent successfully!</span>
          </div>
          <p className="text-green-600 text-sm mt-1">
            We&apos;ll get back to you within 24 hours.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="label">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="input"
          placeholder="Your name"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="label">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="input"
          placeholder="your@email.com"
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="label">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="input"
        >
          <option value="">Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="order">Order Support</option>
          <option value="refund">Refund Request</option>
          <option value="technical">Technical Issue</option>
          <option value="business">Business Inquiry</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="label">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="input resize-none"
          placeholder="How can we help you?"
        />
      </div>

      {/* Submit Button */}
      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            Sending...
          </span>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}
