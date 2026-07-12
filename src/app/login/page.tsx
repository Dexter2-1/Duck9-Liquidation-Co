"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dock9.example");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Login failed.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <form onSubmit={handleSubmit} className="bg-paper text-ink p-8 rounded-md w-full max-w-sm">
        <img src="/logo-icon.png" alt="Dock9" className="h-12 w-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">DOCK9 Admin</h1>
        <p className="text-sm text-gray-600 mb-6">Sign in to manage inventory, orders, and pricing.</p>

        <label className="block text-xs font-semibold uppercase mb-1">Email</label>
        <input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="block text-xs font-semibold uppercase mb-1">Password</label>
        <input type="password" className="input mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button className="btn btn-yellow w-full" type="submit">Sign in</button>

        <a href="/forgot-password" className="block text-xs text-center text-gray-500 underline mt-3">Forgot password?</a>

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>Demo logins (seeded):</p>
          <p>admin@dock9.example / password123</p>
          <p>manager@dock9.example / password123</p>
          <p>warehouse@dock9.example / password123</p>
        </div>
      </form>
    </div>
  );
}
