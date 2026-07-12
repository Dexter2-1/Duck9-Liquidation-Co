"use client";
import { useEffect, useState } from "react";

const conditionLabels: Record<string, string> = {
  LIKE_NEW: "Like New",
  MINOR_SCRATCHES: "Minor Scratches",
  HEAVY_WEAR: "Heavy Wear",
  AS_IS: "As-Is",
};

function BarRow({ label, value, max, formatValue }: { label: string; value: number; max: number; formatValue: (n: number) => string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{formatValue(value)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded h-3">
        <div className="bg-yellow h-3 rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div>Loading…</div>;

  const maxCatRevenue = Math.max(...data.byCategory.map((c: any) => c.revenue), 1);
  const maxCondRevenue = Math.max(...data.byCondition.map((c: any) => c.revenue), 1);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Total revenue (paid)</div>
          <div className="text-3xl font-bold">${Math.round(data.totalRevenue).toLocaleString()}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Paid orders</div>
          <div className="text-3xl font-bold">{data.orderCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Avg. days to sell</div>
          <div className="text-3xl font-bold">{data.avgDaysToSell !== null ? Math.round(data.avgDaysToSell) : "—"}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-6 mb-8">Figures below only count orders marked Paid — reserved-but-unpaid orders aren't counted as sales yet.</p>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-4">Revenue by category</h2>
        {data.byCategory.length === 0 && <p className="text-sm text-gray-500">No sales yet.</p>}
        {data.byCategory.map((c: any) => (
          <BarRow key={c.category} label={`${c.category} (${c.units} sold)`} value={c.revenue} max={maxCatRevenue} formatValue={(n) => `$${Math.round(n).toLocaleString()}`} />
        ))}
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-4">Revenue by condition grade</h2>
        {data.byCondition.length === 0 && <p className="text-sm text-gray-500">No sales yet.</p>}
        {data.byCondition.map((c: any) => (
          <BarRow key={c.condition} label={`${conditionLabels[c.condition] || c.condition} (${c.units} sold)`} value={c.revenue} max={maxCondRevenue} formatValue={(n) => `$${Math.round(n).toLocaleString()}`} />
        ))}
      </div>

      <p className="text-xs text-gray-500">
        This tells you which categories and condition grades actually move — useful for deciding what to source more of from your suppliers, per the Supplier Scorecard idea from your original brief (not built yet, but this data is the foundation for it).
      </p>
    </div>
  );
}
