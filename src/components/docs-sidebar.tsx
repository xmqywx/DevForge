"use client";

import { useState } from "react";
import Link from "next/link";
import { DocSection } from "@/content/docs";
import { useI18n } from "@/lib/i18n";

interface DocsSidebarProps {
  sections: DocSection[];
  activeSlug: string;
}

export function DocsSidebar({ sections, activeSlug }: DocsSidebarProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.content.toLowerCase().includes(query.toLowerCase())
      )
    : sections;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-6">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e135] bg-[#f0f0e8] placeholder-gray-400"
        />
      </div>

      {/* Nav links */}
      <nav className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 px-2 py-1">No results</p>
        ) : (
          filtered.map((section) => {
            const isActive = section.slug === activeSlug;
            return (
              <Link
                key={section.slug}
                href={`/docs/${section.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#c6e135] text-[#1a1a1a]"
                    : "text-gray-600 hover:bg-[#f0f0e8] hover:text-[#1a1a1a]"
                }`}
              >
                {t(section.titleKey)}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
}
