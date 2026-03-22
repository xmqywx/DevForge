"use client";

import { useState } from "react";
import { LuScan, LuLoader } from "react-icons/lu";

export default function SettingsPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      setResult(`Scanned: ${data.total} repos, ${data.created} new, ${data.updated} updated`);
    } catch {
      setResult("Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Git Scanner</h2>
          <p className="text-sm text-gray-500 mt-1">
            Scan ~/Documents for git repositories and import them as projects.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-5 py-2.5 text-sm font-medium hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuScan className="w-4 h-4" />
            )}
            {scanning ? "Scanning..." : "Run Scan"}
          </button>
          {result && (
            <span className="text-sm text-gray-500">{result}</span>
          )}
        </div>
      </div>
    </div>
  );
}
