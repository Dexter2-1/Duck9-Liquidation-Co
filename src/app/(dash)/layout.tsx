import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/manifest", label: "Manifest Manager" },
  { href: "/orders", label: "Orders" },
  { href: "/offers", label: "Offers" },
  { href: "/reviews", label: "Reviews" },
  { href: "/customers", label: "Customers" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/activity", label: "Activity Log" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Site Settings" },
];

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-ink text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-line flex items-center gap-3">
          <img src="/logo-icon.png" alt="Dock9" className="h-9 w-auto" />
          <div>
            <div className="text-xl font-bold">DOCK9</div>
            <div className="text-[11px] uppercase tracking-widest text-gray-400">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <a href="/" target="_blank" className="block px-3 py-2 rounded-md text-sm bg-yellow text-ink font-semibold mb-2">
            ↗ View Storefront
          </a>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block px-3 py-2 rounded-md text-sm hover:bg-steel">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-line text-xs text-gray-400">
          <div className="mb-2">{session.name} · {session.role}</div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  );
}
