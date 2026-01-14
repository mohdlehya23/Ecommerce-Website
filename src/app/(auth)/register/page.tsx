import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account to start purchasing digital products.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center section-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted">
            Join us and start exploring digital products
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
