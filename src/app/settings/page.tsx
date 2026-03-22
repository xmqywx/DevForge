"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Git Scanner</h2>
          <p className="text-sm text-muted-foreground">
            Scan ~/Documents for git repositories and import them as projects.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={runScan} disabled={scanning}>
            {scanning ? "Scanning..." : "Run Scan"}
          </Button>
          {result && (
            <span className="text-sm text-muted-foreground">{result}</span>
          )}
        </div>
      </div>
    </div>
  );
}
