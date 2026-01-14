"use client";

import { motion } from "framer-motion";

interface PricingToggleProps {
  value: "personal" | "commercial";
  onChange: (value: "personal" | "commercial") => void;
  className?: string;
}

export function PricingToggle({
  value,
  onChange,
  className = "",
}: PricingToggleProps) {
  return (
    <div
      className={`inline-flex items-center bg-gray-100 rounded-xl p-1 ${className}`}
    >
      <button
        onClick={() => onChange("personal")}
        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          value === "personal" ? "text-white" : "text-muted hover:text-primary"
        }`}
      >
        {value === "personal" && (
          <motion.div
            layoutId="pricingToggle"
            className="absolute inset-0 bg-accent rounded-lg"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <span className="relative z-10">Personal</span>
      </button>

      <button
        onClick={() => onChange("commercial")}
        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          value === "commercial"
            ? "text-white"
            : "text-muted hover:text-primary"
        }`}
      >
        {value === "commercial" && (
          <motion.div
            layoutId="pricingToggle"
            className="absolute inset-0 bg-accent rounded-lg"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <span className="relative z-10">Commercial</span>
      </button>
    </div>
  );
}
