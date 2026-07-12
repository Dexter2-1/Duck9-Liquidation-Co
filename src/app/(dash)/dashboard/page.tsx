import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const pallets = await prisma.pallet.findMany();
  const orders = await prisma.order.findMany({ include: { items: { include: { pallet: true } } } });

  const sold = orders.filter((o) => o.status !== "PENDING");
  const totalSales = sold.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price, 0), 0);
  const pendingPayouts = orders
    .filter((o) => o.status === "PENDING")
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price, 0), 0);
  const netProfit = sold.reduce((sum, o) => {
    return sum + o.items.reduce((s, i) => s + (i.price - (i.pallet?.cost ?? 0)), 0);
  }, 0);

  const active = pallets.filter((p) => p.status === "ACTIVE");
  const lowStockThreshold = 3;
  const lowStock = active.length <= lowStockThreshold;

  const hotItems = [...active].sort((a, b) => b.price - a.price).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {lowStock && (
        <div className="bg-red-600 text-white rounded-md px-5 py-4 mb-6 font-semibold">
          ⚠ Low stock: only {active.length} active pallet(s) on the board. Time to list more loads.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Total sales</div>
          <div className="text-3xl font-bold">${totalSales.toLocaleString()}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Pending payouts</div>
          <div className="text-3xl font-bold">${pendingPayouts.toLocaleString()}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-gray-500 mb-1">Net profit (all time)</div>
          <div className="text-3xl font-bold">${netProfit.toLocaleString()}</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-3">Hot items — highest value active loads</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="table-cell">SKU</th>
              <th className="table-cell">Title</th>
              <th className="table-cell">Category</th>
              <th className="table-cell">Price</th>
            </tr>
          </thead>
          <tbody>
            {hotItems.map((p) => (
              <tr key={p.id}>
                <td className="table-cell font-mono text-xs">{p.sku}</td>
                <td className="table-cell">{p.title}</td>
                <td className="table-cell">{p.category}</td>
                <td className="table-cell">${p.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
