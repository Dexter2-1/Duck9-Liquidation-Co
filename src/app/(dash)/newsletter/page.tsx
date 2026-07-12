"use client";
import { useEffect, useState } from "react";

export default function NewsletterPage() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/newsletter").then((r) => r.json()).then(setSubs);
  }, []);

  function exportCsv() {
    const rows = ["email,subscribed_at", ...subs.map((s) => `${s.email},${new Date(s.createdAt).toISOString()}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dock9-newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        <button className="btn btn-outline" onClick={exportCsv} disabled={subs.length === 0}>Export CSV</button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Collected from the "Stay Ahead in Wholesale Liquidation" signup form on the storefront. Export and import into your email tool (Mailchimp, etc.) to send new-arrival announcements.</p>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">Email</th>
              <th className="table-cell">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="table-cell text-xs">{s.email}</td>
                <td className="table-cell text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={2} className="table-cell text-center text-gray-500">No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
