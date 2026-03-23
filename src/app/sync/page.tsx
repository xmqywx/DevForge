import { SyncPanel } from "@/components/sync-panel";

export default function SyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Sync</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Push local data to the server and pull feedback from users.
        </p>
      </div>
      <SyncPanel />
    </div>
  );
}
