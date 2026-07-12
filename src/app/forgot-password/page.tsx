"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message || "If that email is registered, a reset link has been sent.");
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="bg-paper text-ink p-8 rounded-md w-full max-w-sm">
        <img src="/logo-icon.png" alt="Dock9" className="h-12 w-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">Reset your password</h1>

        {submitted ? (
          <>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <p className="text-xs text-gray-500">Check your inbox for a link — it expires in 1 hour. No email? Check spam, or confirm the address is correct and try again.</p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 mb-6">Enter your admin account email and we'll send you a link to set a new password.</p>
            <label className="block text-xs font-semibold uppercase mb-1">Email</label>
            <input type="email" required className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-yellow w-full" type="submit">Send reset link</button>
          </form>
        )}

        <a href="/login" className="block text-xs text-center text-gray-500 underline mt-6">Back to sign in</a>
      </div>
    </div>
  );
}
