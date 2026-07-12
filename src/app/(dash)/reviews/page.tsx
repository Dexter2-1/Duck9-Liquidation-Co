"use client";
import { useEffect, useState } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/reviews");
    setReviews(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function update(id: string, data: any) {
    await fetch(`/api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Reviews</h1>
      <p className="text-sm text-gray-500 mb-6">Approve reviews to show them on a pallet's page. Feature a general review (no pallet attached) to show it in the sitewide testimonials section.</p>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">When</th>
              <th className="table-cell">Pallet</th>
              <th className="table-cell">Author</th>
              <th className="table-cell">Rating</th>
              <th className="table-cell">Comment</th>
              <th className="table-cell">Status</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className="table-cell text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="table-cell text-xs">{r.pallet ? `${r.pallet.sku}` : <span className="text-gray-400">General</span>}</td>
                <td className="table-cell text-xs">{r.authorName}</td>
                <td className="table-cell text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                <td className="table-cell text-xs max-w-xs">{r.comment}</td>
                <td className="table-cell">
                  <span className={`text-xs px-2 py-1 rounded ${r.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>{r.approved ? "Approved" : "Pending"}</span>
                  {r.featured && <span className="text-xs px-2 py-1 rounded bg-yellow text-ink ml-1">Featured</span>}
                </td>
                <td className="table-cell text-xs space-x-2 whitespace-nowrap">
                  {!r.approved && <button className="underline" onClick={() => update(r.id, { approved: true })}>Approve</button>}
                  {r.approved && <button className="underline" onClick={() => update(r.id, { approved: false })}>Unapprove</button>}
                  <button className="underline" onClick={() => update(r.id, { featured: !r.featured })}>{r.featured ? "Unfeature" : "Feature"}</button>
                  <button className="underline text-red-600" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-gray-500">No reviews yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
