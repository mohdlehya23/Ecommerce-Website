"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  questions: FAQ[];
}

interface FAQClientProps {
  faqs: FAQCategory[];
}

export function FAQClient({ faqs }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Filter FAQs based on search query
  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const totalResults = filteredFaqs.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );

  return (
    <>
      {/* Search Input */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
          <svg
            className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted mt-2">
            {totalResults} result{totalResults !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* FAQ Categories */}
      {filteredFaqs.length > 0 ? (
        <div className="space-y-8">
          {filteredFaqs.map((category) => (
            <div key={category.category}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq, index) => {
                  const itemId = `${category.category}-${index}`;
                  const isOpen = openItems.has(itemId);

                  return (
                    <div key={itemId} className="card p-0 overflow-hidden">
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="font-medium text-sm">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0"
                        >
                          <svg
                            className="w-5 h-5 text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-6 pb-4 text-muted text-sm">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted mb-2">
            No results found for &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-accent hover:underline text-sm"
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
