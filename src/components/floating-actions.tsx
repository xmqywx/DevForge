"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LuPlus, LuSearch, LuFilter, LuMessageSquare, LuCalendar, LuX } from "react-icons/lu";
import { useI18n } from "@/lib/i18n";

export function FloatingActions() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  // Determine the "Add" action based on current page
  const handleAdd = () => {
    if (pathname.startsWith("/issues")) {
      // Dispatch custom event for issue create dialog
      window.dispatchEvent(new CustomEvent("devforge:create-issue"));
    } else if (pathname.startsWith("/releases")) {
      window.dispatchEvent(new CustomEvent("devforge:create-release"));
    } else if (pathname.startsWith("/milestones")) {
      window.dispatchEvent(new CustomEvent("devforge:create-milestone"));
    } else if (pathname.startsWith("/projects")) {
      window.dispatchEvent(new CustomEvent("devforge:create-project"));
    } else {
      // Default: go to issues page to create
      router.push("/issues");
    }
  };

  const handleSearch = () => {
    setShowSearch((v) => !v);
    if (showSearch && searchQuery.trim()) {
      // Navigate to projects with search query
      router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleFilter = () => {
    // Navigate to the current page's filter — issues kanban has built-in filters
    if (pathname === "/") router.push("/projects");
    else window.dispatchEvent(new CustomEvent("devforge:toggle-filters"));
  };

  const handleMessages = () => {
    router.push("/feedback");
  };

  const handleCalendar = () => {
    router.push("/calendar");
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {/* Search overlay */}
      {showSearch && (
        <div className="absolute left-16 top-12 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 w-72">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
                setShowSearch(false);
                setSearchQuery("");
              }
              if (e.key === "Escape") {
                setShowSearch(false);
                setSearchQuery("");
              }
            }}
            placeholder={t("actions.search")}
            className="flex-1 text-sm outline-none bg-transparent text-[#1a1a1a] placeholder-gray-400"
          />
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add */}
      <button
        onClick={handleAdd}
        title={t("actions.addNew")}
        className="w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center hover:bg-[#333] transition-colors shadow-lg"
      >
        <LuPlus className="w-5 h-5" />
      </button>

      {/* Search */}
      <button
        onClick={handleSearch}
        title={t("actions.search")}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
          showSearch ? "bg-[#c6e135] text-[#1a1a1a]" : "bg-[#1a1a1a] text-white hover:bg-[#333]"
        }`}
      >
        <LuSearch className="w-5 h-5" />
      </button>

      {/* Filter */}
      <button
        onClick={handleFilter}
        title={t("actions.filter")}
        className="w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center hover:bg-[#333] transition-colors shadow-lg"
      >
        <LuFilter className="w-5 h-5" />
      </button>

      {/* Feedback */}
      <button
        onClick={handleMessages}
        title={t("actions.feedback")}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
          pathname.startsWith("/feedback") ? "bg-[#c6e135] text-[#1a1a1a]" : "bg-[#1a1a1a] text-white hover:bg-[#333]"
        }`}
      >
        <LuMessageSquare className="w-5 h-5" />
      </button>

      {/* Calendar / Milestones */}
      <button
        onClick={handleCalendar}
        title={t("actions.calendar")}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
          pathname.startsWith("/calendar") ? "bg-[#c6e135] text-[#1a1a1a]" : "bg-[#1a1a1a] text-white hover:bg-[#333]"
        }`}
      >
        <LuCalendar className="w-5 h-5" />
      </button>
    </div>
  );
}
