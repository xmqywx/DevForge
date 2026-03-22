"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: "🏠", label: "Overview", href: "/" },
  { icon: "📦", label: "Projects", href: "/projects" },
  { icon: "📋", label: "Issues", href: "/issues" },
  { icon: "📊", label: "Timeline", href: "/timeline" },
  { icon: "⚙️", label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-4 gap-2 z-50">
      <Link
        href="/"
        className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-lg mb-4"
      >
        ⚡
      </Link>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-slate-700",
            pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
              ? "bg-blue-600/20 text-blue-400"
              : "text-slate-400"
          )}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
    </aside>
  );
}
