"use client";
import { useI18n, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    const next: Locale = locale === "en" ? "zh" : "en";
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      title="Switch language"
      className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors select-none"
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
