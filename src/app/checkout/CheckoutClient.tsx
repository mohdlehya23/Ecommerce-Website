"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCartStore } from "@/stores/cartStore";
import { Input } from "@/components/ui/Input";
import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface CheckoutClientProps {
  user: User;
  profile: Profile | null;
}

export function CheckoutClient({ user, profile }: CheckoutClientProps) {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    email: user.email || "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal(profile?.user_type || "individual");

  const steps = [
    { id: 1, name: "Information" },
    { id: 2, name: "Payment" },
    { id: 3, name: "Complete" },
  ];

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.email) {
      setStep(2);
    }
  };

  const createOrder = async () => {
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            licenseType: item.license_type,
            price:
              item.license_type === "commercial"
                ? item.product.price_b2b
                : item.product.price_b2c,
          })),
          total: subtotal,
        }),
      });

      const data = await response.json();
      return data.orderId;
    } catch (err) {
      console.error("Error creating order:", err);
      throw err;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderID: data.orderID,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            licenseType: item.license_type,
            price:
              item.license_type === "commercial"
                ? item.product.price_b2b
                : item.product.price_b2c,
          })),
          customerInfo: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        setStep(3);
      } else {
        setError(result.error || "Payment failed. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="section-padding">
        <div className="container-wide max-w-2xl text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted mb-6">Add some products before checkout.</p>
          <button
            onClick={() => router.push("/products")}
            className="btn-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-wide max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors ${
                    step >= s.id
                      ? "bg-accent text-white"
                      : "bg-gray-200 text-muted"
                  }`}
                >
                  {step > s.id ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s.id ? "text-primary font-medium" : "text-muted"
                  }`}
                >
                  {s.name}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 h-0.5 mx-4 ${
                      step > s.id ? "bg-accent" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-6">Your Information</h2>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    Continue to Payment
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-6">Payment</h2>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
                    {error}
                  </div>
                )}

                {isProcessing ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted">Processing your payment...</p>
                  </div>
                ) : (
                  <PayPalScriptProvider
                    options={{
                      clientId:
                        process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                      currency: "USD",
                    }}
                  >
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        setError("Payment failed. Please try again.");
                      }}
                    />
                  </PayPalScriptProvider>
                )}

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-center text-muted hover:text-primary mt-4"
                >
                  ← Back to Information
                </button>
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card text-center"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted mb-6">
                  Thank you for your purchase. You can access your downloads in
                  your dashboard.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-primary"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          {step !== 3 && (
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="font-bold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted">
                        {item.product.title} × {item.quantity}
                        <span className="block text-xs">
                          ({item.license_type})
                        </span>
                      </span>
                      <span className="font-medium">
                        $
                        {(
                          (item.license_type === "commercial"
                            ? item.product.price_b2b
                            : item.product.price_b2c) * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-accent">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
