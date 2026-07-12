"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token"));
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(data.error || "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="bg-paper text-ink p-8 rounded-md w-full max-w-sm">
        <img src="/logo-icon.png" alt="Dock9" className="h-12 w-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">Set a new password</h1>

        {!token ? (
          <p className="text-sm text-gray-600 mt-4">This link is missing its reset token — make sure you opened the exact link from your email, or <a href="/forgot-password" className="underline">request a new one</a>.</p>
        ) : done ? (
          <p className="text-sm text-green-700 mt-4">Password updated — redirecting you to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <label className="block text-xs font-semibold uppercase mb-1">New password</label>
            <input type="password" required minLength={8} className="input mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label className="block text-xs font-semibold uppercase mb-1">Confirm new password</label>
            <input type="password" required minLength={8} className="input mb-4" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button className="btn btn-yellow w-full" type="submit">Set new password</button>
          </form>
        )}

        <a href="/login" className="block text-xs text-center text-gray-500 underline mt-6">Back to sign in</a>
      </div>
    </div>
  );
}
