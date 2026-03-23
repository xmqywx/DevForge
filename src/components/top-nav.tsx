"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCode, LuBell } from "react-icons/lu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Issues", href: "/issues" },
  { label: "Feedback", href: "/feedback" },
  { label: "Releases", href: "/releases" },
  { label: "Milestones", href: "/milestones" },
  { label: "Sync", href: "/sync" },
  { label: "Settings", href: "/settings" },
  { label: "Docs", href: "/docs" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
            <LuCode className="w-5 h-5 text-[#c6e135]" />
          </div>
          <span className="font-bold text-lg text-[#1a1a1a]">DevForge</span>
        </Link>

        {/* Center tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[#c6e135] text-[#1a1a1a]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: avatar + bell */}
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <LuBell className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c6e135] to-emerald-400 flex items-center justify-center text-sm font-bold text-[#1a1a1a]">
            Y
          </div>
        </div>
      </div>
    </nav>
  );
}
