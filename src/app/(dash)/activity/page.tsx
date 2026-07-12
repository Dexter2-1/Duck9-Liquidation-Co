"use client";
import { useEffect, useState } from "react";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/activity").then((r) => r.json()).then(setLogs);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">When</th>
              <th className="table-cell">User</th>
              <th className="table-cell">Action</th>
              <th className="table-cell">Target</th>
              <th className="table-cell">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="table-cell text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="table-cell text-xs">{l.user?.name} ({l.user?.role})</td>
                <td className="table-cell text-xs font-mono">{l.action}</td>
                <td className="table-cell text-xs">{l.target}</td>
                <td className="table-cell text-xs text-gray-600">{l.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
