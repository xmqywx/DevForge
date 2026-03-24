"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCode, LuBell } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_ITEMS = [
  { key: "nav.overview", href: "/" },
  { key: "nav.projects", href: "/projects" },
  { key: "nav.issues", href: "/issues" },
  { key: "nav.feedback", href: "/feedback" },
  { key: "nav.releases", href: "/releases" },
  { key: "nav.milestones", href: "/milestones" },
  { key: "nav.calendar", href: "/calendar" },
  { key: "nav.sync", href: "/sync" },
  { key: "nav.settings", href: "/settings" },
  { key: "nav.docs", href: "/docs" },
];

export function TopNav() {
  const pathname = usePathname();
  const { t } = useI18n();

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
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        {/* Right: language switcher + bell + avatar */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
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
