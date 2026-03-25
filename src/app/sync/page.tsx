"use client";

import { useI18n } from "@/lib/i18n";
import { SyncPanel } from "@/components/sync-panel";

export default function SyncPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("sync.title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {t("sync.pageDescription")}
        </p>
      </div>
      <SyncPanel />
    </div>
  );
}
